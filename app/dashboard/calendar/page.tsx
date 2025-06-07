"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { useAuth } from "@/components/auth-provider"

export default function CalendarPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user?.id) return
      try {
        // Fetch all tasks for the user's households (like TaskList)
        const res = await fetch(`/api/user-tasks?userId=${user.id}`)
        const data = await res.json()
        if (data.success) {
          setEvents(
            data.tasks.map((task: any) => ({
              title: task.title,
              start: task.dueTime,
              allDay: true,
              color: task.status === "completed" ? "#4ade80" : undefined, // Mint green for completed
            }))
          )
        }
      } catch (e) {
        setEvents([])
      }
    }
    fetchTasks()
  }, [user?.id])

  return (
    <DashboardLayout>
      <div className="container p-4 md:p-6 space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight mb-4">Calendar</h1>
        <div className="bg-card rounded-lg shadow p-2">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay"
            }}
            height="auto"
            events={events}
            themeSystem="standard"
            dayMaxEvents={2}
            editable={false}
            selectable={true}
          />
        </div>
      </div>
    </DashboardLayout>
  )
} 