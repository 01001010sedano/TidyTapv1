import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"

const adminConfig = {
  type: process.env.FIREBASE_ADMIN_TYPE,
  project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
  private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
}

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
