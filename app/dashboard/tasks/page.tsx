"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TaskSummary } from "@/components/task-summary"
import { TaskList } from "@/components/task-list"
import { useAuth } from "@/components/auth-provider"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function TasksPage() {
  const { user } = useAuth();
  const [households, setHouseholds] = useState([])
  const [selectedHelper, setSelectedHelper] = useState<string>("all")
  const [helpers, setHelpers] = useState([])
  const [filter, setFilter] = useState("all")

  // Fetch households for helpers
  useEffect(() => {
    if (user?.role === "helper") {
      fetch(`/api/user-households?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setHouseholds(data.data.households)
        })
    }
  }, [user])

  // Fetch helpers for managers
  useEffect(() => {
    if (user?.role === "manager" && user.householdId) {
      fetch(`/api/household?householdId=${user.householdId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setHelpers(data.data.members.filter((m: any) => m.role === "helper"))
          }
        })
    }
  }, [user])

  return (
    <DashboardLayout>
      <div className="container p-4 md:p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">View and manage your tasks here.</p>
        </div>

        {user?.role === "manager" && (
          <>
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mt-6 mb-2">
              <div className="w-full sm:w-[240px]">
                <Select value={selectedHelper} onValueChange={setSelectedHelper}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by helper" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Helpers</SelectItem>
                    {helpers.map((helper: any) => (
                      <SelectItem key={helper.id} value={helper.id}>
                        {helper.name || helper.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <TaskList helperId={selectedHelper !== "all" ? selectedHelper : undefined} />
          </>
        )}

        {user?.role === "helper" && households.length > 0 && (
          <>
            <div className="w-full sm:w-[240px] mb-4">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="assigned-to-me">Assigned to Me</SelectItem>
                  <SelectItem value="high-priority">High Priority</SelectItem>
                  <SelectItem value="medium-priority">Medium Priority</SelectItem>
                  <SelectItem value="low-priority">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-8 mt-2">
              {households.map((household: any) => (
                <div key={household.id} className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{household.name}</CardTitle>
                    </CardHeader>
                  </Card>
                  <TaskList householdId={household.id} filter={filter} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
} 