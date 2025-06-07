import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"
import { adminConfig } from "./firebase-config"

// Initialize Firebase Admin
let adminApp
if (!getApps().length) {
  adminApp = initializeApp({
    credential: cert(adminConfig as any),
    projectId: adminConfig.project_id,
  })
} else {
  adminApp = getApps()[0]
}

// Initialize Firestore and Auth
const adminDb = getFirestore(adminApp)
const adminAuth = getAuth(adminApp)

export { adminApp, adminDb, adminAuth }
