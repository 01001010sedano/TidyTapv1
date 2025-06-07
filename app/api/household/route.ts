import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId')

    if (!householdId) {
      return NextResponse.json({ 
        success: false,
        error: "Missing household ID"
      }, { status: 400 })
    }

    // Fetch household document
    const householdDoc = await adminDb.collection("households").doc(householdId).get()
    
    if (!householdDoc.exists) {
      return NextResponse.json({ 
        success: false,
        error: "Household not found"
      }, { status: 404 })
    }

    const householdData = householdDoc.data()

    // Fetch all member details
    const memberPromises = householdData.members.map(async (memberId: string) => {
      const memberDoc = await adminDb.collection("users").doc(memberId).get()
      if (memberDoc.exists) {
        const memberData = memberDoc.data()
        return {
          id: memberId,
          name: memberData.name,
          email: memberData.email,
          role: memberData.role,
        }
      }
      return null
    })

    const members = (await Promise.all(memberPromises)).filter(Boolean)

    return NextResponse.json({
      success: true,
      data: {
        ...householdData,
        members
      }
    })
  } catch (error) {
    console.error("Error fetching household data:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch household data"
    }, { status: 500 })
  }
} 