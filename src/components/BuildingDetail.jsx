import { useEffect, useMemo, useState } from "react";
import AddressInput from "./UI/AddressInput.jsx";

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

export default function BuildingDetail({ buildingId, currentUser }) {
  const [building, setBuilding] = useState(null);
  const [apartments, setApartments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");

  // 🔥 Récupération du bâtiment et de ses appartements
  useEffect(() => {
    if (!buildingId) return;
    const unsubInfo = onSnapshot(doc(db, "buildings", buildingId), (d) =>
      setBuilding({ id: d.id, ...d.data() })
    );
    const unsubApts = onSnapshot(
      collection(db, "buildings", buildingId, "apartments"),
      (snap) => setApartments(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => {
      unsubInfo && unsubInfo();
      unsubApts && unsubApts();
    };
  }, [buildingId]);

  // 🧩 Sécurité Hooks
  const floors = useMemo(
    () =>
      Array.from(
        { length: Math.max(1, Number(building?.floorsCount || 1)) },
        (_, i) => i + 1
      ),
    [building?.floorsCount]
  );

  // 🏗️ Fonctions Firestore
  async function updateAddress(address, lat, lng) {
    const updateData = { address };
    if (lat && lng) {
      updateData.lat = lat;
      updateData.lng = lng;
    }
    await updateDoc(doc(db, "buildings", buildingId), updateData);
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
  async function updateApartment(aid, patch) {
    await updateDoc(doc(db, "buildings", buildingId, "apartments", aid), patch);
  }
  async function removeApartment(aid) {
    await deleteDoc(doc(db, "buildings", buildingId, "apartments", aid));
  }
  async function markVisited(a) {
    const now = new Date().toISOString();
    await updateApartment(a.id, {
      visitedAt: now,
      visitedBy: currentUser?.uid || null,
    });
    if (currentUser?.uid) {
      await addDoc(collection(db, "users", currentUser.uid, "visits"), {
        buildingId,
        apartmentId: a.id,
        timestamp: now,
      });
    }
  }

  // 🧱 UI – Cas où aucun bâtiment n’est sélectionné
  if (!buildingId) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 text-sm text-gray-500 flex items-center justify-center h-full"
      >
        Sélectionne ou crée un bâtiment…
      </motion.div>
    );
  }
  if (!building) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 text-sm text-gray-500"
      >
        Chargement du bâtiment…
      </motion.div>
    );
  }

  // 🏢 Sous-composant pour les étages
  function FloorSection({ floor }) {
    const [newLabel, setNewLabel] = useState("");
    let items = apartments.filter((a) => a.floor === floor);
    if (statusFilter !== "all") {
      items = items.filter((a) => (a.status || "none") === statusFilter);
    }
    items = items.sort((a, b) => (a.label || "").localeCompare(b.label || ""));

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-xs border border-gray-200 bg-white shadow-sm p-4"
      >
        <div className="flex flex-wrap items-end gap-3 justify-between">
          <div className="font-semibold text-[#FF7900]">Étage {floor}</div>
          <div className="flex gap-2 items-end">
            <div className="min-w-[200px]">
              <TextInput
                label="Nouvel appartement"
                value={newLabel}
                onChange={setNewLabel}
                placeholder="Numéro (ex.: 12A)"
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

        <div className="mt-3 grid gap-3">
          <AnimatePresence>
            {items.map((a) => (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="rounded-xs border border-gray-200 p-3 bg-gray-50 hover:bg-gray-100 transition"
              >
                <div className="grid md:grid-cols-4 gap-3">
                  <div className="font-medium flex items-center text-gray-800">
                    🏠 App {a.label}
                  </div>
                  <Select
                    label="Statut"
                    value={a.status || "none"}
                    onChange={(val) => updateApartment(a.id, { status: val })}
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
                    value={a.notes || ""}
                    onChange={(v) => updateApartment(a.id, { notes: v })}
                    placeholder="Détails rapides…"
                  />
                  <div className="flex items-end gap-2">
                    <Button onClick={() => markVisited(a)} kind="primary">
                      Passé aujourd’hui
                    </Button>
                    <Button kind="ghost" onClick={() => removeApartment(a.id)}>
                      Supprimer
                    </Button>
                  </div>
                </div>
                {a.visitedAt && (
                  <div className="text-xs text-gray-500 mt-1">
                    Dernier passage :{" "}
                    <span className="font-medium text-gray-700">
                      {new Date(a.visitedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {items.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-gray-500"
            >
              Aucun appartement à cet étage pour ce filtre.
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }

  // 🧠 Rendu principal
  return (
    <motion.div
      key={buildingId}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      {/* Barre supérieure */}
      <motion.div
        layout
        className="flex flex-wrap items-end gap-3 bg-white border rounded-xs p-4 shadow-sm"
      >
        <div className="min-w-[280px]">
          <AddressInput
            label="Adresse"
            value={building.address || ""}
            onChange={({ address, lat, lng }) => {
              updateAddress(address, lat, lng);
            }}
          />
        </div>
        <div className="w-44">
          <TextInput
            label="Nombre d'étages"
            type="number"
            value={building.floorsCount || 1}
            onChange={updateFloors}
          />
        </div>
        <div className="w-60">
          <Select
            label="Filtrer par statut"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "Tous" },
              { value: "interesse", label: "Intéressé" },
              { value: "rappeler", label: "À rappeler" },
              { value: "conclu", label: "Conclu" },
              { value: "absent", label: "Absent" },
              { value: "none", label: "— (non défini)" },
            ]}
          />
        </div>
      </motion.div>

      {/* Étages */}
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
