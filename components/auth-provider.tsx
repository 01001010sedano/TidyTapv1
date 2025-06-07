"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth"
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  updateDoc,
  arrayUnion,
} from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

type User = {
  id: string
  email: string | null
  name: string | null
  role: "manager" | "helper"
  householdId?: string
}

type RegisterResult = {
  success: boolean
  message: string
  inviteCode?: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string, remember: boolean) => Promise<void>
  register: (
    email: string,
    password: string,
    name: string,
    role: "manager" | "helper",
    householdCode?: string,
  ) => Promise<RegisterResult>
  loginWithGoogle: () => Promise<void>
  loginWithFacebook: () => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Listen for auth state changes
  useEffect(() => {
    let mounted = true

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!mounted) return

        if (firebaseUser) {
          // User is signed in
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))

          if (!mounted) return

          if (userDoc.exists()) {
            // User exists in Firestore
            const userData = userDoc.data()
            
            // If user is a manager, ensure we have their householdId
            let householdId = userData.householdId
            if (userData.role === "manager" && !householdId) {
              householdId = `household_${firebaseUser.uid}`
            }

            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || userData.name,
              role: userData.role,
              householdId: householdId,
            })
          } else {
            // User exists in Auth but not in Firestore (edge case)
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              role: "helper", // Default role
            })
          }
        } else {
          // User is signed out
          setUser(null)
        }
      } catch (error) {
        console.error("Error in auth state change:", error)
        // Reset user state on error
        if (mounted) {
          setUser(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string, remember: boolean) => {
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      // Wait for auth state to update
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error("Login error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (
    email: string,
    password: string,
    name: string,
    role: "manager" | "helper",
    householdCode?: string,
  ) => {
    setLoading(true)
    try {
      // Step 1: Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      // Step 2: Update profile with name
      await updateProfile(firebaseUser, {
        displayName: name,
      })

      if (role === "manager") {
        // For managers, create documents via API
        const response = await fetch("/api/create-initial-documents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || name,
            role,
          }),
        })

        const data = await response.json()
        
        if (!data.success) {
          // If API call fails, delete the auth account and throw error
          await firebaseUser.delete()
          throw new Error(data.error + (data.details ? `: ${data.details}` : ""))
        }

        // Sign out after successful registration
        await signOut(auth)
        
        return { 
          success: true,
          message: "Account created successfully! Please log in to continue.",
          inviteCode: data.inviteCode
        }
      } else if (householdCode) {
        // For helpers, verify and join household
        const verifyResponse = await fetch("/api/check-household-code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            householdCode,
            userId: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || name,
            role,
          }),
        })

        const verifyData = await verifyResponse.json()
        
        if (!verifyData.valid) {
          // If verification fails, delete the auth account
          await firebaseUser.delete()
          throw new Error("Invalid household code")
        }

        // Sign out after successful registration
        await signOut(auth)

        return { 
          success: true,
          message: "Account created successfully! Please log in to continue."
        }
      }

      // Sign out after successful registration
      await signOut(auth)
      
      return { 
        success: true,
        message: "Account created successfully! Please log in to continue."
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      
      // Handle specific error cases
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("This email is already registered. Please try logging in instead.")
      }
      
      throw error
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const firebaseUser = result.user

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))

      if (!userDoc.exists()) {
        // First time Google sign-in, create user in Firestore
        await setDoc(doc(db, "users", firebaseUser.uid), {
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          role: "helper", // Default role
          createdAt: serverTimestamp(),
        })
      }
    } catch (error) {
      console.error("Google login error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const loginWithFacebook = async () => {
    setLoading(true)
    try {
      const provider = new FacebookAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const firebaseUser = result.user

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))

      if (!userDoc.exists()) {
        // First time Facebook sign-in, create user in Firestore
        await setDoc(doc(db, "users", firebaseUser.uid), {
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          role: "helper", // Default role
          createdAt: serverTimestamp(),
        })
      }
    } catch (error) {
      console.error("Facebook login error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      console.error("Password reset error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        loginWithFacebook,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
