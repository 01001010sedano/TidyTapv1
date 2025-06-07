import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function POST(request: Request) {
  try {
    const { userId, householdId } = await request.json()

    if (!userId || !householdId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    try {
      await adminDb.runTransaction(async (transaction) => {
        // Get the user document
        const userRef = adminDb.collection("users").doc(userId)
        const userDoc = await transaction.get(userRef)
        
        if (!userDoc.exists) {
          throw new Error("User not found")
        }

        // Get the household document
        const householdRef = adminDb.collection("households").doc(householdId)
        const householdDoc = await transaction.get(householdRef)
        
        if (!householdDoc.exists) {
          throw new Error("Household not found")
        }

        const householdData = householdDoc.data()
        if (!householdData) {
          throw new Error("Household data is missing")
        }

        // Update user document to remove householdId if it matches
        const userData = userDoc.data()
        if (userData && userData.householdId === householdId) {
          transaction.update(userRef, {
            householdId: null
          })
        }

        // Remove user from household members
        const members = householdData.members || []
        const updatedMembers = members.filter((id: string) => id !== userId)
        transaction.update(householdRef, {
          members: updatedMembers
        })
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("Transaction error:", error)
      return NextResponse.json(
        { 
          success: false, 
          error: "Database transaction failed", 
          details: error instanceof Error ? error.message : "Unknown error"
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error leaving household:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to leave household",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
} 