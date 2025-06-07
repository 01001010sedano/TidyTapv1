import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

export async function POST(request: Request) {
  try {
    const { householdCode, userId, email, name, role } = await request.json()

    if (!householdCode) {
      return NextResponse.json({ 
        valid: false, 
        message: "No household code provided" 
      }, { status: 400 })
    }

    // Query for the household with this invite code
    const householdsRef = adminDb.collection("households")
    const querySnapshot = await householdsRef
      .where("inviteCode", "==", householdCode)
      .limit(1)
      .get()

    if (querySnapshot.empty) {
      return NextResponse.json({ 
        valid: false, 
        message: "Invalid household code" 
      }, { status: 200 })
    }

    const householdDoc = querySnapshot.docs[0]
    const householdData = householdDoc.data()

    // If we have user details, create user document and add to household
    if (userId && email && name && role) {
      await adminDb.runTransaction(async (transaction) => {
        // Create user document
        const userRef = adminDb.collection("users").doc(userId)
        transaction.set(userRef, {
          name,
          email,
          role,
          householdId: householdDoc.id,
          createdAt: FieldValue.serverTimestamp(),
        })

        // Update household members
        transaction.update(householdDoc.ref, {
          members: FieldValue.arrayUnion(userId)
        })
      })
    }

    return NextResponse.json({
      valid: true,
      householdId: householdDoc.id,
      householdName: householdData.name,
    })
  } catch (error) {
    console.error("Error checking/joining household:", error)
    return NextResponse.json({ 
      valid: false, 
      message: "Error processing request",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
