import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: "Missing user ID"
      }, { status: 400 })
    }

    // Query for all households where the user is a member
    const householdsRef = adminDb.collection("households")
    const querySnapshot = await householdsRef
      .where("members", "array-contains", userId)
      .get()

    const households = []
    
    // For each household, get the manager's details
    for (const doc of querySnapshot.docs) {
      const householdData = doc.data()
      
      // Get manager details
      const managerDoc = await adminDb.collection("users").doc(householdData.managerId).get()
      const managerData = managerDoc.exists ? managerDoc.data() : null

      // Only add the household if we can get the manager's data
      if (managerData) {
        households.push({
          id: doc.id,
          name: householdData.name || "Unnamed Household",
          inviteCode: householdData.inviteCode,
          manager: {
            id: householdData.managerId,
            name: managerData.name || null,
            email: managerData.email || null,
          }
        })
      }
    }

    console.log('Found households:', households) // Add logging to help debug

    return NextResponse.json({
      success: true,
      data: {
        households
      }
    })
  } catch (error) {
    console.error("Error fetching user households:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch household data"
    }, { status: 500 })
  }
} 