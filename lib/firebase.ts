import { initializeApp, getApps } from "firebase/app"
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getAnalytics } from "firebase/analytics"
import { firebaseConfig } from "./firebase-config"

// Initialize Firebase
let firebaseApp
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig)
} else {
  firebaseApp = getApps()[0]
}

// Initialize Firebase services
const auth = getAuth(firebaseApp)

// Set persistence to LOCAL (persists even after browser restart)
if (typeof window !== "undefined") {
  // Handle persistence setup
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Firebase persistence error:", error)
  })
}

const db = getFirestore(firebaseApp)
let analytics

// Only initialize analytics on the client side
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(firebaseApp)
  } catch (error) {
    console.error("Analytics initialization error:", error)
  }
}

export { firebaseApp, auth, db, analytics }
