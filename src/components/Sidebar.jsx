import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { auth, db } from "../firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import Button from "./UI/Button.jsx";

function todayRange() {
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0
  );
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59
  );
  return { start, end };
}

// CSV Helpers
function csvEscape(value) {
  if (!value) return "";
  const s = String(value).replace(/"/g, '""');
  return s.includes(",") || s.includes("\n") ? `"${s}"` : s;
}

function downloadCSV(filename, rows) {
  const header = [
    "timestamp",
    "building_id",
    "building_address",
    "apartment_id",
    "floor",
    "apartment_label",
    "status",
    "notes",
  ];

  const lines = [header.join(",")];

  for (const r of rows) {
    lines.push(
      [
        csvEscape(r.timestamp),
        csvEscape(r.buildingId),
        csvEscape(r.buildingAddress),
        csvEscape(r.apartmentId),
        csvEscape(r.floor),
        csvEscape(r.apartmentLabel),
        csvEscape(r.status),
        csvEscape(r.notes),
      ].join(",")
    );
  }

  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

export default function Sidebar({
  user,
  selectedBuildingId,
  onSelectBuilding,
}) {
  const [name, setName] = useState(user?.displayName || "");
  const [address, setAddress] = useState("");
  const [floorsCount, setFloorsCount] = useState(5);
  const [buildings, setBuildings] = useState([]);
  const [doorCount, setDoorCount] = useState(0);

  const uid = user?.uid;

  // ------------------------------
  // 🔥 Load buildings live
  // ------------------------------
  useEffect(() => {
    const q = query(collection(db, "buildings"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setBuildings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, []);

  // ------------------------------
  // 🔥 Load user profile
  // ------------------------------
  useEffect(() => {
    if (!uid) return;

    const load = async () => {
      const ref = doc(db, "users", uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        await setDoc(ref, {
          displayName: name || "Utilisateur",
          createdAt: serverTimestamp(),
        });
      } else {
        const dn = snap.data()?.displayName;
        if (!name) setName(dn || "");
      }
    };

    load();
  }, [uid]);

  // ------------------------------
  // 🔥 Count doors visited today
  // ------------------------------
  useEffect(() => {
    if (!uid) return;

    const ref = collection(db, "users", uid, "visits");

    const unsub = onSnapshot(ref, (snap) => {
      const { start, end } = todayRange();

      const count = snap.docs.reduce((acc, d) => {
        const t = d.data().timestamp ? new Date(d.data().timestamp) : null;
        return t && t >= start && t <= end ? acc + 1 : acc;
      }, 0);

      setDoorCount(count);
    });

    return () => unsub();
  }, [uid]);

  // ------------------------------
  // 🔥 Actions
  // ------------------------------
  async function saveName() {
    if (!auth.currentUser) return;

    await auth.currentUser.reload();
    await auth.currentUser.updateProfile?.({ displayName: name });

    await setDoc(
      doc(db, "users", uid),
      { displayName: name, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }

  async function addBuilding() {
    if (!address.trim()) return;

    const ref = await addDoc(collection(db, "buildings"), {
      address: address.trim(),
      floorsCount: Number(floorsCount),
      createdBy: uid,
      createdAt: serverTimestamp(),
    });

    setAddress("");
    onSelectBuilding(ref.id);
  }

  async function exportToday() {
    if (!uid) return;

    const { start, end } = todayRange();
    const visitsSnap = await getDocs(collection(db, "users", uid, "visits"));

    const todayVisits = visitsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((v) => {
        const t = v.timestamp ? new Date(v.timestamp) : null;
        return t && t >= start && t <= end;
      });

    const rows = [];

    for (const v of todayVisits) {
      const buildingSnap = await getDoc(doc(db, "buildings", v.buildingId));
      const building = buildingSnap.exists() ? buildingSnap.data() : {};

      const apartmentSnap = v.apartmentId
        ? await getDoc(
            doc(db, "buildings", v.buildingId, "apartments", v.apartmentId)
          )
        : null;

      const apartment = apartmentSnap?.exists() ? apartmentSnap.data() : {};

      rows.push({
        timestamp: v.timestamp,
        buildingId: v.buildingId,
        buildingAddress: building.address || "",
        apartmentId: v.apartmentId || "",
        floor: apartment.floor || "",
        apartmentLabel: apartment.label || "",
        status: apartment.status || "",
        notes: apartment.notes || "",
      });
    }

    downloadCSV(`visites_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  // ------------------------------
  // 🟧 UI
  // ------------------------------
  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="h-full bg-black text-white flex flex-col border-r border-white/10"
    >
      {/* ---------------------- */}
      {/* 🔸 1. Profil */}
      {/* ---------------------- */}
      <div className="p-4 border-b border-white/10">
        <div className="text-xs text-white/60 mb-1">Profil</div>

        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom"
            className="w-full rounded-sm border border-white/20 bg-black/40 px-3 py-2 text-sm"
          />
          <Button kind="dark" onClick={saveName}>
            OK
          </Button>
        </div>
      </div>

      {/* ---------------------- */}
      {/* 🔸 2. Portes du jour */}
      {/* ---------------------- */}
      <div className="p-4 border-b border-white/10">
        <div className="text-xs text-white/60">Portes aujourd’hui</div>
        <div className="text-4xl font-extrabold mt-1">{doorCount}</div>

        <Button onClick={exportToday} kind="dark" className="mt-3 w-full">
          Exporter CSV
        </Button>
      </div>

      {/* ---------------------- */}
      {/* 🔸 3. Ajouter bâtiment */}
      {/* ---------------------- */}
      <div className="p-4 border-b border-white/10">
        <div className="text-xs text-white/60 mb-2">Nouveau bâtiment</div>

        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Adresse"
          className="w-full rounded-sm border border-white/20 bg-black/40 px-3 py-2 text-sm mb-2"
        />

        <input
          type="number"
          value={floorsCount}
          onChange={(e) => setFloorsCount(Number(e.target.value))}
          className="w-full rounded-sm border border-white/20 bg-black/40 px-3 py-2 text-sm mb-3"
        />

        <Button onClick={addBuilding} kind="dark" className="w-full">
          Ajouter
        </Button>
      </div>

      {/* ---------------------- */}
      {/* 🔸 4. Liste bâtiments */}
      {/* ---------------------- */}
      <div className="p-4 overflow-auto">
        <div className="text-xs text-white/60 mb-2">Bâtiments</div>

        <div className="space-y-2">
          {buildings.map((b) => (
            <div
              key={b.id}
              onClick={() => onSelectBuilding(b.id)}
              className={`rounded-sm border border-white/20 p-3 cursor-pointer transition ${
                selectedBuildingId === b.id ? "bg-white/10" : "bg-black/20"
              }`}
            >
              <div className="font-medium">{b.address}</div>
              <div className="text-xs text-white/60">
                {b.floorsCount} étages
              </div>
            </div>
          ))}

          {buildings.length === 0 && (
            <div className="text-xs text-white/40">Aucun bâtiment.</div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
