import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

export async function POST(request: Request) {
  try {
    const { userId, email, name, role } = await request.json()

    if (!userId || !email || !name || !role) {
      return NextResponse.json({ 
        success: false,
        error: "Missing required fields",
        details: { userId, email, name, role }
      }, { status: 400 })
    }

    const householdId = `household_${userId}`
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
    const fixedInviteCode = `TIDY-${randomPart}`

    try {
      // Create both documents using admin SDK
      await adminDb.runTransaction(async (transaction) => {
        // Create household document
        const householdRef = adminDb.collection("households").doc(householdId)
        transaction.set(householdRef, {
          name: `${name}'s Household`,
          managerId: userId,
          inviteCode: fixedInviteCode,
          members: [userId],
          createdAt: FieldValue.serverTimestamp(),
        })

        // Create user document
        const userRef = adminDb.collection("users").doc(userId)
        transaction.set(userRef, {
          name,
          email,
          role,
          householdId,
          createdAt: FieldValue.serverTimestamp(),
        })
      })

      return NextResponse.json({
        success: true,
        householdId,
        inviteCode: fixedInviteCode,
      })
    } catch (error: unknown) {
      console.error("Transaction error:", error)
      return NextResponse.json({ 
        success: false,
        error: "Database transaction failed",
        details: typeof error === 'object' && error && 'message' in error ? (error as { message: string }).message : String(error)
      }, { status: 500 })
    }
  } catch (error: unknown) {
    console.error("Request processing error:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to process request",
      details: typeof error === 'object' && error && 'message' in error ? (error as { message: string }).message : String(error)
    }, { status: 500 })
  }
} 