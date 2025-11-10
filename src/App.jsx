import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
} from "firebase/auth";
import { auth, providerGoogle } from "./firebase";
import Header from "./components/Header.jsx";
import Sidebar from "./components/Sidebar.jsx";
import BuildingDetail from "./components/BuildingDetail.jsx";
import Button from "./components/UI/Button.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState(null);

  // ✅ Gestion de l'état utilisateur
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        // Par défaut : ne rien faire, on propose Google
        setReady(true);
        return;
      }
      setUser(u);
      setReady(true);
    });
    return () => unsub();
  }, []);

  // ✅ Connexion Google
  async function handleGoogleSignIn() {
    try {
      const result = await signInWithPopup(auth, providerGoogle);
      setUser(result.user);
      console.log("Connecté avec Google :", result.user.displayName);
    } catch (err) {
      console.error("Erreur connexion Google :", err);
      alert(
        "Impossible de se connecter via Google. Vérifie ta config Firebase."
      );
    }
  }

  // ✅ Connexion Anonyme (optionnelle)
  async function handleAnonymousSignIn() {
    try {
      const res = await signInAnonymously(auth);
      setUser(res.user);
      console.log("Connecté anonymement :", res.user.uid);
    } catch (err) {
      console.error("Erreur connexion anonyme :", err);
    }
  }

  // ✅ Écran d’attente
  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <div className="text-sm text-gray-600">Initialisation…</div>
      </div>
    );
  }

  // ✅ Écran de login si pas connecté
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center space-y-6">
        <h1 className="text-3xl font-bold text-[#FF7900]">
          Porte-à-Porte Fibre
        </h1>
        <p className="text-gray-600 max-w-sm">
          Connectez-vous pour commencer à gérer vos bâtiments, étages et
          appartements.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleGoogleSignIn} kind="primary">
            Connexion avec Google
          </Button>
          <Button onClick={handleAnonymousSignIn} kind="ghost">
            Mode invité
          </Button>
        </div>
      </div>
    );
  }

  // ✅ Interface principale quand connecté
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
