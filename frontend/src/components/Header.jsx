import { motion } from "framer-motion";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Header({ user }) {
  async function handleLogout() {
    try {
      await signOut(auth);
      window.location.reload();
    } catch (err) {
      console.error("Erreur de déconnexion :", err);
      alert("Impossible de se déconnecter pour le moment.");
    }
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full bg-[#FF7900] text-white shadow-md px-5 py-3 flex items-center justify-between"
    >
      {/* --- Logo + Titre --- */}
      <motion.div
        className="flex items-center gap-4"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        {/* Logos */}
        <div className="flex items-center gap-2">
          <img
            src="/images/circet-logo.png"
            alt="Circet"
            className="h-8 w-auto rounded bg-white p-1 shadow-sm"
          />
          <img
            src="/images/orange-logo.png"
            alt="Orange"
            className="h-8 w-auto rounded bg-white p-1 shadow-sm"
          />
        </div>

        {/* Texte principal */}
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-extrabold tracking-tight">
            Porte-à-Porte Fibre
          </span>
          <span className="text-xs opacity-90">
            Circet / Orange · Gestion des visites
          </span>
        </div>
      </motion.div>

      {/* --- Espace utilisateur + Déconnexion --- */}
      <motion.div
        className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span>
          {user?.displayName
            ? `Bonjour, ${user.displayName}`
            : "Connexion anonyme"}
        </span>

        {/* Bouton X (Déconnexion) */}
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.2, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          className="ml-2 text-white/70 hover:text-red-300 transition-colors font-bold"
          title="Déconnexion"
        >
          ×
        </motion.button>
      </motion.div>
    </motion.header>
  );
}
