"use client"

import { useEffect, useState, useRef, useLayoutEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

export function SplashScreen() {
  const [progress, setProgress] = useState(0)
  const router = useRouter()
  const { user, loading } = useAuth()
  const barRef = useRef<HTMLDivElement>(null)
  const broomWidth = 80 // px, matches w-20
  const [barWidth, setBarWidth] = useState(0)

  useLayoutEffect(() => {
    if (barRef.current) {
      setBarWidth(barRef.current.offsetWidth)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(interval)
            return 100
          }
          return prevProgress + 0.5
        })
      }, 50)

      return () => clearInterval(interval)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (progress === 100 && !loading) {
      const timer = setTimeout(() => {
        if (user) {
          router.push("/dashboard")
        } else {
          router.push("/auth/login")
        }
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [progress, router, user, loading])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-4xl font-bold text-primary">TidyTap</h1>
        </div>
        <div className="w-full space-y-4 relative" style={{ height: 80 }}>
          <img
            src="/sweep-unscreen.gif"
            alt="Sweeping animation"
            className="w-20 h-20 absolute top-0 z-10 transition-all duration-100 object-contain"
            style={{
              left: barWidth
                ? `${(progress / 100) * (barWidth - broomWidth) - broomWidth / 2 + 20}px`
                : -broomWidth / 2 + 20,
              transform: 'translateX(0)',
              objectPosition: 'center'
            }}
          />
          <div className="pt-12" ref={barRef}>
            <Progress value={progress} className="h-3 w-full bg-secondary" />
          </div>
          <p className="text-center text-sm text-muted-foreground">Loading your household tasks...</p>
        </div>
      </div>
    </div>
  )
}
