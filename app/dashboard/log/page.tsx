"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent } from "@/components/ui/card"

export default function LogPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/task-log?userId=" + user?.id)
        const data = await res.json()
        if (data.success) {
          setLogs(data.logs)
        } else {
          setLogs([])
        }
      } catch (e) {
        setLogs([])
      } finally {
        setLoading(false)
      }
    }
    if (user?.id) fetchLogs()
  }, [user?.id])

  return (
    <DashboardLayout>
      <div className="container p-4 md:p-6 space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight mb-4">Task Log</h1>
        <p className="text-muted-foreground mb-4">See all completed tasks and activity history.</p>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-muted-foreground">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Task</th>
                    <th className="px-4 py-2 text-left">Completed By</th>
                    <th className="px-4 py-2 text-left">Completed At</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={3} className="px-4 py-4 text-center">Loading...</td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-4 text-center text-muted-foreground">No completed tasks found.</td></tr>
                  ) : (
                    logs.map((log, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-4 py-2">{log.title}</td>
                        <td className="px-4 py-2">{log.completedByName || log.completedBy || 'Unknown'}</td>
                        <td className="px-4 py-2">{log.completedAt ? new Date(log.completedAt).toLocaleString() : ''}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 