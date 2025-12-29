import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDS7oSdsrJTIW-GrSumrRnMxZ47OAeChZM",
  authDomain: "meksec-1111.firebaseapp.com",
  projectId: "meksec-1111",
  storageBucket: "meksec-1111.firebasestorage.app",
  messagingSenderId: "148963824532",
  appId: "1:148963824532:web:488a98ffef6ac2cfdd7581",
  measurementId: "G-LWQ18MXW61"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export default app;