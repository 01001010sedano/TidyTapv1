import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 })
    }

    // Fetch user info
    const userDoc = await adminDb.collection("users").doc(userId).get()
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }
    const user = userDoc.data() as any
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    let tasks: any[] = []
    if (user.role === "manager" || user.role === "counselor") {
      if (!user.householdId) {
        return NextResponse.json({ success: true, tasks: [] })
      }
      const tasksSnap = await adminDb.collection("tasks")
        .where("householdId", "==", user.householdId).get()
      tasks = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } else {
      // For helpers, get all households they are a member of
      const householdsSnap = await adminDb.collection("households")
        .where("members", "array-contains", userId).get()
      const householdIds = householdsSnap.docs.map(doc => doc.id)
      if (householdIds.length === 0) {
        return NextResponse.json({ success: true, tasks: [] })
      }
      // Firestore 'in' queries are limited to 10 items
      for (let i = 0; i < householdIds.length; i += 10) {
        const batchIds = householdIds.slice(i, i + 10)
        const batchSnap = await adminDb.collection("tasks")
          .where("householdId", "in", batchIds).get()
        tasks = tasks.concat(batchSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      }
    }
    return NextResponse.json({ success: true, tasks })
  } catch (e) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
} 