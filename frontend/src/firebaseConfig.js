// frontend/src/firebaseConfig.js
import { getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your Web App's Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCPyyhiN46grG3g0--2j_e3uEOKPyPTeKI", // Your Key
  authDomain: "personalized-ca.firebaseapp.com",
  projectId: "personalized-ca",
  storageBucket: "personalized-ca.firebasestorage.app",
  messagingSenderId: "375795182944",
  appId: "1:375795182944:web:e285a6b5765f6923398205",
  measurementId: "G-K5FZ8S1FDN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services you need
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);