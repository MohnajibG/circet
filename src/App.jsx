import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
} from "firebase/auth";

import { motion } from "framer-motion";
import { auth, providerGoogle } from "./firebase";

import Header from "./components/Header.jsx";
import Sidebar from "./components/Sidebar.jsx";
import BuildingDetail from "./components/BuildingDetail.jsx";
import Button from "./components/UI/Button.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState(null);

  // ------------------------------------------------------
  // 🔐 Gestion de l’état d’authentification
  // ------------------------------------------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
    return () => unsub();
  }, []);

  // ------------------------------------------------------
  // 🔐 Connexion Google
  // ------------------------------------------------------
  async function handleGoogleSignIn() {
    try {
      const result = await signInWithPopup(auth, providerGoogle);
      setUser(result.user);
      console.log("Connecté via Google :", result.user.displayName);
    } catch (err) {
      console.error("Erreur Google Sign-In :", err);
      alert("Erreur Google. Vérifie ta configuration Firebase.");
    }
  }

  // ------------------------------------------------------
  // 🔐 Connexion Téléphone (à implémenter)
  // ------------------------------------------------------
  function handlePhoneSignIn() {
    alert("La connexion par Téléphone n’est pas encore activée.");
  }

  // ------------------------------------------------------
  // 🔐 Connexion Anonyme
  // ------------------------------------------------------
  async function handleAnonymousSignIn() {
    try {
      const res = await signInAnonymously(auth);
      setUser(res.user);
      console.log("Connecté anonymement :", res.user.uid);
    } catch (err) {
      console.error("Erreur connexion anonyme :", err);
    }
  }

  // ------------------------------------------------------
  // 🕒 Écran de chargement
  // ------------------------------------------------------
  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <div className="text-sm text-gray-600">Initialisation…</div>
      </div>
    );
  }

  // ------------------------------------------------------
  // 🔐 Écran de connexion si non connecté
  // ------------------------------------------------------
  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-6"
      >
        {/* Logos */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-6 mb-10"
        >
          <img
            src="/images/circet-logo.png"
            className="h-12 w-auto bg-white p-2 rounded shadow"
            alt="Circet"
          />
          <img
            src="/images/orange-logo.png"
            className="h-12 w-auto bg-white p-2 rounded shadow"
            alt="Orange"
          />
        </motion.div>

        <h1 className="text-3xl font-bold text-[#FF7900] mb-2">
          Porte-à-Porte Fibre
        </h1>
        <p className="text-gray-600 max-w-sm mb-6">
          Connectez-vous pour gérer vos bâtiments et visites.
        </p>

        {/* Boutons */}
        <div className="flex justify-around gap-4 w-full max-w-xs">
          <div
            kind="primary"
            onClick={handleGoogleSignIn}
            className="flex items-center justify-center gap-3"
          >
            <img
              src="/icons/google.png"
              alt="Connexion Google"
              className="h-10 w-10"
            />
          </div>

          <div
            kind="dark"
            onClick={handlePhoneSignIn}
            disabled
            className="flex items-center justify-center gap-3"
          >
            <img
              src="/icons/phone.png"
              alt="Connexion Téléphone"
              className="h-10 w-10"
            />
          </div>

          <div
            kind="ghost"
            onClick={handleAnonymousSignIn}
            className="flex items-center justify-center gap-3"
          >
            <img
              src="/icons/guest.png"
              alt="Mode Invité"
              className="h-10 w-10"
            />
          </div>
        </div>
      </motion.div>
    );
  }

  // ------------------------------------------------------
  // 🌐 Interface principale après connexion
  // ------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header user={user} />
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr]">
        <Sidebar
          user={user}
          selectedBuildingId={selectedBuildingId}
          onSelectBuilding={setSelectedBuildingId}
        />
        <main>
          <BuildingDetail buildingId={selectedBuildingId} currentUser={user} />
        </main>
      </div>
    </div>
  );
}
