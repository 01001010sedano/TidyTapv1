import { DashboardLayout } from "@/components/dashboard-layout"
import { TaskList } from "@/components/task-list"
import { TaskSummary } from "@/components/task-summary"
import { ShrimpyChat } from "@/components/ShrimpyChat"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="container p-4 md:p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Manage your household tasks and track progress</p>
        </div>

        <TaskSummary />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Today's Tasks</h2>
          </div>
          <TaskList />
        </div>
      </div>
      <ShrimpyChat />
    </DashboardLayout>
  )
}
