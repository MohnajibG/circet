import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAmS_1U-ElVHiM2SPzYDC8bwzSFw8PuqbU",
  authDomain: "circet-16342.firebaseapp.com",
  projectId: "circet-16342",
  storageBucket: "circet-16342.appspot.com",
  messagingSenderId: "60790213021",
  appId: "1:60790213021:web:465a764c17c9c0c690c774",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const providerGoogle = new GoogleAuthProvider(); // 👈 ajoute cette ligne
