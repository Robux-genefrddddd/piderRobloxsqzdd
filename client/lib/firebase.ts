import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD7KlxN05OoSCGHwjXhiiYyKF5bOXianLY",
  authDomain: "keysystem-d0b86-8df89.firebaseapp.com",
  projectId: "keysystem-d0b86-8df89",
  storageBucket: "keysystem-d0b86-8df89.firebasestorage.app",
  messagingSenderId: "1048409565735",
  appId: "1:1048409565735:web:5a9f5422826949490dfc02",
  measurementId: "G-GK1R043YTV",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);

// Enable persistence so auth state is maintained on page refresh
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Failed to enable persistence:", error);
});

export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;
