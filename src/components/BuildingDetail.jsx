import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import Button from "./UI/Button.jsx";
import TextInput from "./UI/TextInput.jsx";
import Select from "./UI/Select.jsx";
import AddressInput from "./UI/AddressInput.jsx";

export default function BuildingDetail({ buildingId, currentUser }) {
  const [building, setBuilding] = useState(null);
  const [apartments, setApartments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");

  // ----------------------------------------------------------
  //  🔥 Récupération en temps réel du bâtiment + appartements
  // ----------------------------------------------------------
  useEffect(() => {
    if (!buildingId) return;

    const unsubBuilding = onSnapshot(doc(db, "buildings", buildingId), (snap) =>
      setBuilding({ id: snap.id, ...snap.data() })
    );

    const unsubApts = onSnapshot(
      collection(db, "buildings", buildingId, "apartments"),
      (snap) => setApartments(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubBuilding?.();
      unsubApts?.();
    };
  }, [buildingId]);

  // ----------------------------------------------------------
  //  🧱 Floors list (safe / memoized)
  // ----------------------------------------------------------
  const floors = useMemo(() => {
    const count = Math.max(1, Number(building?.floorsCount || 1));
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [building?.floorsCount]);

  // ----------------------------------------------------------
  //  🔧 Firestore helpers
  // ----------------------------------------------------------
  async function updateAddress(address, lat, lng) {
    const data = { address };
    if (lat && lng) {
      data.lat = lat;
      data.lng = lng;
    }
    await updateDoc(doc(db, "buildings", buildingId), data);
  }

  async function updateFloors(v) {
    const n = Math.max(1, Number(v) || 1);
    await updateDoc(doc(db, "buildings", buildingId), { floorsCount: n });
  }

  async function addApartment(floor, label) {
    if (!label?.trim()) return;
    await addDoc(collection(db, "buildings", buildingId, "apartments"), {
      floor,
      label: label.trim(),
      status: "none",
      notes: "",
      visitedAt: null,
      visitedBy: null,
      createdAt: serverTimestamp(),
    });
  }

  async function updateApartment(id, patch) {
    await updateDoc(doc(db, "buildings", buildingId, "apartments", id), patch);
  }

  async function deleteApartment(id) {
    await deleteDoc(doc(db, "buildings", buildingId, "apartments", id));
  }

  async function markVisited(apartment) {
    const now = new Date().toISOString();

    await updateApartment(apartment.id, {
      visitedAt: now,
      visitedBy: currentUser?.uid ?? null,
    });

    if (currentUser?.uid) {
      await addDoc(collection(db, "users", currentUser.uid, "visits"), {
        buildingId,
        apartmentId: apartment.id,
        timestamp: now,
      });
    }
  }

  // ----------------------------------------------------------
  // 📌 UI si aucun bâtiment sélectionné
  // ----------------------------------------------------------
  if (!buildingId) {
    return (
      <div className="p-6 text-sm text-gray-500 flex items-center justify-center h-full">
        Sélectionne ou crée un bâtiment…
      </div>
    );
  }

  if (!building) {
    return (
      <div className="p-6 text-sm text-gray-500">Chargement du bâtiment…</div>
    );
  }

  // ----------------------------------------------------------
  //  🧩 Sous composant : un étage
  // ----------------------------------------------------------
  function FloorSection({ floor }) {
    const [newLabel, setNewLabel] = useState("");

    let items = apartments.filter((a) => a.floor === floor);
    if (statusFilter !== "all") {
      items = items.filter((a) => a.status === statusFilter);
    }
    items = items.sort((a, b) => a.label.localeCompare(b.label));

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-gray-200 bg-white shadow-sm p-4"
      >
        {/* Title + Add apartment */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="font-semibold text-orange-600">Étage {floor}</div>

          <div className="flex items-end gap-2">
            <div className="min-w-[200px]">
              <TextInput
                label="Nouvel appartement"
                value={newLabel}
                onChange={setNewLabel}
                placeholder="Ex : 12A"
              />
            </div>

            <Button
              onClick={() => {
                addApartment(floor, newLabel);
                setNewLabel("");
              }}
            >
              + Ajouter
            </Button>
          </div>
        </div>

        {/* Apartments list */}
        <div className="mt-3 grid gap-3">
          <AnimatePresence>
            {items.map((a) => (
              <ApartmentCard
                key={a.id}
                a={a}
                updateApartment={updateApartment}
                deleteApartment={deleteApartment}
                markVisited={markVisited}
              />
            ))}
          </AnimatePresence>

          {items.length === 0 && (
            <div className="text-xs text-gray-500">
              Aucun appartement pour ce filtre.
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // ----------------------------------------------------------
  // 🏠 Composant : Carte d'appartement
  // ----------------------------------------------------------
  function ApartmentCard({ a, updateApartment, deleteApartment, markVisited }) {
    const [localNotes, setLocalNotes] = useState(a.notes || "");

    // 🔥 Debounce notes (500ms)
    useEffect(() => {
      const t = setTimeout(() => {
        if (localNotes !== a.notes) {
          updateApartment(a.id, { notes: localNotes });
        }
      }, 500);
      return () => clearTimeout(t);
    }, [localNotes]);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="rounded-lg border border-gray-200 bg-gray-50 p-3 shadow-sm"
      >
        <div className="grid md:grid-cols-4 gap-3">
          <div className="font-medium flex items-center text-gray-800">
            🏠 App {a.label}
          </div>

          <Select
            label="Statut"
            value={a.status}
            onChange={(v) => updateApartment(a.id, { status: v })}
            options={[
              { value: "none", label: "—" },
              { value: "absent", label: "Absent" },
              { value: "interesse", label: "Intéressé" },
              { value: "rappeler", label: "À rappeler" },
              { value: "conclu", label: "Conclu" },
            ]}
          />

          <TextInput
            label="Notes"
            value={localNotes}
            onChange={setLocalNotes}
            placeholder="Notes…"
          />

          <div className="flex items-end gap-2">
            <Button onClick={() => markVisited(a)} kind="primary">
              Passé
            </Button>

            <Button kind="ghost" onClick={() => deleteApartment(a.id)}>
              Supprimer
            </Button>
          </div>
        </div>

        {a.visitedAt && (
          <div className="text-xs text-gray-500 mt-1">
            Dernier passage :{" "}
            <span className="font-medium">
              {new Date(a.visitedAt).toLocaleString()}
            </span>
          </div>
        )}
      </motion.div>
    );
  }

  // ----------------------------------------------------------
  // Rendu principal
  // ----------------------------------------------------------
  return (
    <motion.div
      key={buildingId}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-6"
    >
      {/* Top editing bar */}
      <motion.div
        layout
        className="flex flex-wrap gap-3 bg-white border rounded-lg p-4 shadow-sm"
      >
        <div className="min-w-[280px]">
          <AddressInput
            label="Adresse"
            value={building.address}
            onChange={({ address, lat, lng }) =>
              updateAddress(address, lat, lng)
            }
          />
        </div>

        <div className="w-44">
          <TextInput
            label="Étages"
            type="number"
            value={building.floorsCount}
            onChange={updateFloors}
          />
        </div>

        <div className="w-60">
          <Select
            label="Filtrer"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "Tous" },
              { value: "interesse", label: "Intéressé" },
              { value: "rappeler", label: "À rappeler" },
              { value: "conclu", label: "Conclu" },
              { value: "absent", label: "Absent" },
              { value: "none", label: "—" },
            ]}
          />
        </div>
      </motion.div>

      {/* Floors */}
      <motion.div layout className="grid gap-4">
        <AnimatePresence>
          {floors.map((f) => (
            <FloorSection key={f} floor={f} />
          ))}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
