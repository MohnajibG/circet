import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  getDocs,
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
    59,
    999
  );
  return { start, end };
}

// Helpers CSV
function csvEscape(value) {
  if (value == null) return "";
  const s = String(value).replace(/"/g, '""');
  if (s.includes(",") || s.includes("\n") || s.includes('"')) return `"${s}"`;
  return s;
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
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Sidebar({
  user,
  selectedBuildingId,
  onSelectBuilding,
}) {
  const [address, setAddress] = useState("");
  const [floorsCount, setFloorsCount] = useState(5);
  const [buildings, setBuildings] = useState([]);
  const [doorCount, setDoorCount] = useState(0);
  const [name, setName] = useState(user?.displayName || "");
  const uid = user?.uid;

  // Listen buildings
  useEffect(() => {
    const q = query(collection(db, "buildings"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setBuildings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Ensure user doc + displayName
  useEffect(() => {
    const go = async () => {
      if (!uid) return;
      const uref = doc(db, "users", uid);
      const snap = await getDoc(uref);
      if (!snap.exists()) {
        await setDoc(uref, {
          displayName: user?.displayName || "Utilisateur",
          createdAt: serverTimestamp(),
        });
      } else {
        const dn = snap.data()?.displayName || user?.displayName || "";
        if (!name) setName(dn);
      }
    };
    go();
  }, [name, uid, user?.displayName]);

  // Door count today (visits)
  useEffect(() => {
    if (!uid) return;
    const vref = collection(db, "users", uid, "visits");
    const unsub = onSnapshot(vref, (snap) => {
      const { start, end } = todayRange();
      const count = snap.docs.reduce((acc, d) => {
        const t = d.data().timestamp ? new Date(d.data().timestamp) : null;
        if (t && t >= start && t <= end) return acc + 1;
        return acc;
      }, 0);
      setDoorCount(count);
    });
    return () => unsub();
  }, [uid]);

  async function saveName() {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    await auth.currentUser
      .updateProfile?.({ displayName: name || "Utilisateur" })
      .catch(() => {});
    await setDoc(
      doc(db, "users", uid),
      { displayName: name || "Utilisateur", updatedAt: serverTimestamp() },
      { merge: true }
    );
  }

  async function addBuilding(e) {
    e?.preventDefault?.();
    if (!address.trim()) return;
    const docRef = await addDoc(collection(db, "buildings"), {
      address: address.trim(),
      floorsCount: Math.max(1, Number(floorsCount) || 1),
      createdBy: uid || null,
      createdAt: serverTimestamp(),
    });
    setAddress("");
    onSelectBuilding?.(docRef.id);
  }

  // Export CSV des visites du jour
  async function exportTodayCSV() {
    if (!uid) return;
    const { start, end } = todayRange();

    // 1) Récupère toutes les visites de l'utilisateur
    const visitsSnap = await getDocs(collection(db, "users", uid, "visits"));

    const todayVisits = visitsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((v) => {
        const t = v.timestamp ? new Date(v.timestamp) : null;
        return t && t >= start && t <= end;
      });

    // 2) Charge les métadonnées des bâtiments et apparts pour enrichir le CSV
    const rows = [];
    for (const v of todayVisits) {
      const bref = doc(db, "buildings", v.buildingId);
      const brefSnap = await getDoc(bref);
      const building = brefSnap.exists()
        ? { id: brefSnap.id, ...brefSnap.data() }
        : null;

      let apartment = null;
      if (v.apartmentId) {
        const aref = doc(
          db,
          "buildings",
          v.buildingId,
          "apartments",
          v.apartmentId
        );
        const arefSnap = await getDoc(aref);
        apartment = arefSnap.exists()
          ? { id: arefSnap.id, ...arefSnap.data() }
          : null;
      }

      rows.push({
        timestamp: v.timestamp || "",
        buildingId: v.buildingId || "",
        buildingAddress: building?.address || "",
        apartmentId: v.apartmentId || "",
        floor: apartment?.floor ?? "",
        apartmentLabel: apartment?.label ?? "",
        status: apartment?.status ?? "",
        notes: apartment?.notes ?? "",
      });
    }

    // 3) Télécharge
    const iso = new Date().toISOString().slice(0, 10);
    downloadCSV(`visites_${iso}.csv`, rows);
  }

  return (
    <aside className="h-full bg-black text-white flex flex-col">
      {/* Counter */}
      <div className="p-4 border-b border-white/10">
        <div className="text-xs text-white/70">Portes aujourd'hui</div>
        <div className="text-3xl font-extrabold">{doorCount}</div>
        <div className="mt-3">
          <Button kind="dark" onClick={exportTodayCSV}>
            Exporter les visites du jour (CSV)
          </Button>
        </div>
      </div>

      {/* Profile */}
      <div className="p-4 border-b border-white/10 space-y-2">
        <div className="text-xs text-white/70">Profil</div>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Votre nom"
            className="w-full rounded-xs border border-white/15 bg-black/40 px-3 py-2 outline-none focus:ring-2 focus:ring-white/40 placeholder-white/40"
          />
          <Button
            kind="dark"
            className="hover: bg-amber-50/30 rounded-xs"
            onClick={saveName}
          >
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Add building */}
      <div className="p-4 border-b border-white/10">
        <form onSubmit={addBuilding} className="space-y-3">
          <label className="block text-sm font-medium">
            Ajouter un bâtiment
          </label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Adresse (ex.: 12 Rue de la Paix)"
            className="w-full rounded-xs border border-white/15 bg-black/40 px-3 py-2 outline-none focus:ring-2 focus:ring-white/40 placeholder-white/40"
          />
        </form>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            value={floorsCount}
            onChange={(e) =>
              setFloorsCount(Math.max(1, Number(e.target.value) || 1))
            }
            className="w-28 rounded-xs border border-white/15 bg-black/40 px-3 py-2 outline-none focus:ring-2 focus:ring-white/40"
          />
          <Button
            kind="dark "
            className="hover: bg-amber-50/30 rounded-xs"
            onClick={addBuilding}
          >
            Ajouter
          </Button>
        </div>
      </div>

      {/* Buildings list */}
      <div className="p-4 overflow-auto">
        <div className="text-xs text-white/70 mb-2">Bâtiments</div>
        <div className="space-y-2">
          {buildings.map((b) => (
            <div
              key={b.id}
              onClick={() => onSelectBuilding(b.id)}
              className={`rounded-xs border border-white/10 p-3 cursor-pointer ${
                selectedBuildingId === b.id ? "ring-2 ring-white/30" : ""
              }`}
            >
              <div className="text-sm font-medium">{b.address}</div>
              <div className="text-xs text-white/60">
                {b.floorsCount || 0} étage(s)
              </div>
            </div>
          ))}
          {buildings.length === 0 && (
            <div className="text-xs text-white/50">
              Aucun bâtiment pour l’instant.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
