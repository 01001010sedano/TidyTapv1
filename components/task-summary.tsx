"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Clock, ListTodo } from "lucide-react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function TaskSummary() {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    completionRate: 0,
  })
  const { user } = useAuth()

  useEffect(() => {
    const fetchTaskStats = async () => {
      if (!user?.id) return

      try {
        const tasksRef = collection(db, "tasks")
        let q;

        if (user.role === "helper") {
          // For helpers, first get all their households
          const response = await fetch(`/api/user-households?userId=${user.id}`)
          const data = await response.json()
          
          if (data.success && data.data.households.length > 0) {
            // Get tasks from all households the helper is part of
            const householdIds = data.data.households.map((h: { id: string }) => h.id)
            q = query(tasksRef, where("householdId", "in", householdIds))
          } else {
            setStats({
              total: 0,
              completed: 0,
              inProgress: 0,
              pending: 0,
              completionRate: 0,
            })
            return
          }
        } else {
          // For managers, just get tasks from their household
          if (!user.householdId) return
          q = query(tasksRef, where("householdId", "==", user.householdId))
        }

        const querySnapshot = await getDocs(q)
        const tasks = querySnapshot.docs.map(doc => doc.data())
        
        const total = tasks.length
        const completed = tasks.filter(task => task.status === "completed").length
        const inProgress = tasks.filter(task => task.status === "in-progress").length
        const pending = tasks.filter(task => task.status === "pending").length
        const completionRate = total > 0 ? (completed / total) * 100 : 0

        setStats({
          total,
          completed,
          inProgress,
          pending,
          completionRate,
        })
      } catch (error) {
        console.error("Error fetching task stats:", error)
      }
    }

    fetchTaskStats()
  }, [user?.id, user?.householdId, user?.role])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          <ListTodo className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">Tasks for today</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completed}</div>
          <p className="text-xs text-muted-foreground">{stats.completionRate.toFixed(1)}% completion rate</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <Clock className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.inProgress}</div>
          <p className="text-xs text-muted-foreground">Tasks currently being worked on</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pending}</div>
          <p className="text-xs text-muted-foreground">Tasks waiting to be started</p>
        </CardContent>
      </Card>
    </div>
  )
}
