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

import { FiTrash2, FiCheck, FiHome } from "react-icons/fi";
import { MdOutlineSaveAlt } from "react-icons/md";

import Button from "./UI/Button.jsx";
import TextInput from "./UI/TextInput.jsx";
import Select from "./UI/Select.jsx";
import AddressInput from "./UI/AddressInput.jsx";

export default function BuildingDetail({ buildingId, currentUser }) {
  const [building, setBuilding] = useState(null);
  const [apartments, setApartments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");

  // ----------------------------------------------------------
  //  🔥 Live building + apartments
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
  //  🧱 Floors list
  // ----------------------------------------------------------
  const floors = useMemo(() => {
    const count = Math.max(1, Number(building?.floorsCount || 1));
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [building?.floorsCount]);

  // ----------------------------------------------------------
  //  🔧 Firestore helpers
  // ----------------------------------------------------------
  async function updateAddress(address, lat, lng) {
    const data = { address, lat, lng };
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

  async function markVisited(a) {
    const now = new Date().toISOString();

    await updateApartment(a.id, {
      visitedAt: now,
      visitedBy: currentUser?.uid ?? null,
    });

    if (currentUser?.uid) {
      await addDoc(collection(db, "users", currentUser.uid, "visits"), {
        buildingId,
        apartmentId: a.id,
        timestamp: now,
      });
    }
  }

  // ----------------------------------------------------------
  //  📌 No building selected / loading
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
  //  🧩 Floor section
  // ----------------------------------------------------------
  function FloorSection({ floor }) {
    const [newLabel, setNewLabel] = useState("");

    let items = apartments
      .filter((a) => a.floor === floor)
      .filter((a) => statusFilter === "all" || a.status === statusFilter)
      .sort((a, b) => a.label.localeCompare(b.label));

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 130, damping: 18 }}
        className="rounded-xs border border-gray-200 bg-white shadow-sm p-3 sm:p-4 space-y-3 sm:space-y-4"
      >
        {/* Header étage + ajout app */}
        <div className="flex flex-wrap items-end justify-between gap-3 max-sm:flex-col max-sm:items-start">
          <div className="font-semibold text-orange-600 text-base">
            Étage {floor}
          </div>

          <div className="flex items-end gap-2 w-full sm:w-auto max-sm:flex-col">
            <div className="min-w-[200px] max-sm:w-full">
              <TextInput
                label="Nouvel appartement"
                value={newLabel}
                onChange={setNewLabel}
                placeholder="Ex : 12A"
              />
            </div>
            <Button
              className="max-sm:w-full"
              onClick={() => {
                addApartment(floor, newLabel);
                setNewLabel("");
              }}
            >
              + Ajouter
            </Button>
          </div>
        </div>

        {/* Liste des appartements */}
        <div className="grid gap-2 sm:gap-3">
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
  //  🏠 Apartment card
  // ----------------------------------------------------------
  function ApartmentCard({ a, updateApartment, deleteApartment, markVisited }) {
    const [localNotes, setLocalNotes] = useState(a.notes || "");

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 140, damping: 18 }}
        className="rounded-xs border border-gray-200 bg-gray-50 p-3 sm:p-4 shadow-sm space-y-3"
      >
        {/* Ligne titre + statut */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="font-medium flex items-center gap-2 text-gray-800">
            <FiHome /> <span>App {a.label}</span>
          </div>

          <div className="sm:w-56 w-full">
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
              className="w-full"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Notes</label>
          <div className="relative">
            <textarea
              className="w-full rounded-xs border border-gray-300 bg-white p-2 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 max-sm:text-sm"
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              rows={2}
              placeholder="Notes…"
            />
            <button
              onClick={() => updateApartment(a.id, { notes: localNotes })}
              className="absolute right-1.5 bottom-1.5 inline-flex items-center justify-center h-7 w-7 bg-orange-500 text-white active:scale-95 transition transform rounded-full"
              aria-label="Enregistrer les notes"
            >
              <MdOutlineSaveAlt className="text-xs font-extrabold " />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            onClick={() => markVisited(a)}
            kind="primary"
            className="flex items-center gap-2 max-sm:flex-1 justify-center"
          >
            <FiCheck /> <span>Passé</span>
          </Button>

          <Button
            kind="ghost"
            onClick={() => deleteApartment(a.id)}
            className="flex items-center gap-2 text-red-500 max-sm:flex-1 justify-center"
          >
            <FiTrash2 /> <span>Supprimer</span>
          </Button>
        </div>

        {/* Dernier passage */}
        {a.visitedAt && (
          <div className="text-xs text-gray-500 pt-1">
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
  //  Rendu principal
  // ----------------------------------------------------------
  return (
    <motion.div
      key={buildingId}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6"
    >
      {/* Barre d’édition en haut */}
      <motion.div
        layout
        className="bg-white border border-gray-200 rounded-xs shadow-sm p-3 sm:p-4 flex flex-wrap items-end gap-3 sm:gap-4 max-sm:flex-col"
      >
        <div className="min-w-[260px] flex-1 w-full">
          <AddressInput
            label="Adresse"
            value={building.address}
            onChange={({ address, lat, lng }) =>
              updateAddress(address, lat, lng)
            }
          />
        </div>

        <div className="w-32 max-sm:w-full">
          <TextInput
            label="Étages"
            type="number"
            value={building.floorsCount}
            onChange={updateFloors}
          />
        </div>

        <div className="w-44 max-sm:w-full">
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

      {/* Étages */}
      <motion.div layout className="grid gap-4 sm:gap-5">
        <AnimatePresence>
          {floors.map((f) => (
            <FloorSection key={f} floor={f} />
          ))}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
