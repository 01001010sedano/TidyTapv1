import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore"

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

    let tasksQSnap
    if (user.role === "manager" || user.role === "counselor") {
      if (!user.householdId) {
        return NextResponse.json({ success: true, logs: [] })
      }
      tasksQSnap = await adminDb.collection("tasks")
        .where("householdId", "==", user.householdId)
        .where("status", "==", "completed").get()
    } else {
      // For helpers, get all households they are a member of
      const householdsSnap = await adminDb.collection("households")
        .where("members", "array-contains", userId).get()
      const householdIds = householdsSnap.docs.map(doc => doc.id)
      if (householdIds.length === 0) {
        return NextResponse.json({ success: true, logs: [] })
      }
      // Firestore 'in' queries are limited to 10 items
      let logs: any[] = []
      for (let i = 0; i < householdIds.length; i += 10) {
        const batchIds = householdIds.slice(i, i + 10)
        const batchSnap = await adminDb.collection("tasks")
          .where("householdId", "in", batchIds)
          .where("status", "==", "completed").get()
        logs = logs.concat(batchSnap.docs.map(doc => doc.data()))
      }
      // Add completedByName
      const logsWithNames = await Promise.all(logs.map(async (data: any) => {
        let completedByName = null
        if (data.completedBy) {
          const completedByDoc = await adminDb.collection("users").doc(data.completedBy).get()
          const completedByData = typeof completedByDoc.data === 'function' ? completedByDoc.data() : null
          completedByName = (completedByDoc.exists && completedByData && completedByData.name) ? completedByData.name : null
        }
        return {
          title: data.title,
          completedBy: data.completedBy,
          completedByName,
          completedAt: data.completedAt,
        }
      }))
      logsWithNames.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
      return NextResponse.json({ success: true, logs: logsWithNames })
    }

    // For managers/counselors
    const logs: any[] = []
    for (const doc of tasksQSnap.docs) {
      const data = doc.data() as any
      let completedByName = null
      if (data.completedBy) {
        const completedByDoc = await adminDb.collection("users").doc(data.completedBy).get()
        const completedByData = typeof completedByDoc.data === 'function' ? completedByDoc.data() : null
        completedByName = (completedByDoc.exists && completedByData && completedByData.name) ? completedByData.name : null
      }
      logs.push({
        title: data.title,
        completedBy: data.completedBy,
        completedByName,
        completedAt: data.completedAt,
      })
    }
    logs.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
    return NextResponse.json({ success: true, logs })
  } catch (e) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
} 