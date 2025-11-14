import { signInWithPopup } from "firebase/auth";
import { auth, providerGoogle } from "./firebase";

function LoginGoogleButton() {
  async function handleLogin() {
    try {
      const result = await signInWithPopup(auth, providerGoogle);
      const user = result.user;
      console.log("Connecté :", user.displayName, user.email);
    } catch (error) {
      console.error("Erreur de connexion Google :", error);
    }
  }

  return (
    <button
      onClick={handleLogin}
      className="bg-[#FF7900] text-white font-semibold px-4 py-2 rounded-xl hover:brightness-110"
    >
      Se connecter avec Google
    </button>
  );
}

export default LoginGoogleButton;
