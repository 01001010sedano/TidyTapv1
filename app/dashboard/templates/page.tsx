"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { TaskTemplates } from "@/components/task-templates"

export default function TemplatesPage() {
  return (
    <DashboardLayout>
      <div className="container p-6 md:p-8 space-y-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Task Templates</h1>
          <p className="text-muted-foreground text-lg">Create and manage reusable task templates for your household</p>
        </div>

        <TaskTemplates />
      </div>
    </DashboardLayout>
  )
} 