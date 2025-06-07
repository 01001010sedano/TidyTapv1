import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

export async function GET() {
  try {
    // Example: List users (limited to 10)
    const listUsersResult = await adminAuth.listUsers(10)

    return NextResponse.json({
      users: listUsersResult.users.map((user) => ({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      })),
    })
  } catch (error) {
    console.error("Error listing users:", error)
    return NextResponse.json({ error: "Failed to list users" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { email, password, displayName } = await request.json()

    // Create a new user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    })

    // Store additional user data in Firestore
    await adminDb.collection("users").doc(userRecord.uid).set({
      email,
      displayName,
      role: "helper",
      createdAt: new Date(),
    })

    return NextResponse.json({ uid: userRecord.uid })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
