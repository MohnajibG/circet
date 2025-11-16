import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyChXCddioiLRbb8l3_v4diSpwlO5KReW2U",
  authDomain: "portes-d8860.firebaseapp.com",
  projectId: "portes-d8860",
  storageBucket: "portes-d8860.firebasestorage.app",
  messagingSenderId: "802002675994",
  appId: "1:802002675994:web:fd4a79a7ee1e78839424a3",
  measurementId: "G-NDKTZRMKZB",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const providerGoogle = new GoogleAuthProvider();
export const db = getFirestore(app);
