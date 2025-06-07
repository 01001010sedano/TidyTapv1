"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Clock, Edit, MoreHorizontal, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

type Task = {
  id: string
  title: string
  description: string
  status: "pending" | "in-progress" | "completed"
  priority: "low" | "medium" | "high"
  dueTime: string
  householdId: string
  assignedTo: Array<{
    id: string
    name: string
  }>
}

type Household = {
  id: string
  name: string
  inviteCode: string
  manager: {
    id: string
    name: string | null
    email: string | null
  }
}

export function TaskList({ helperId, householdId, filter: externalFilter }: { helperId?: string; householdId?: string; filter?: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState("all")
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [vacuumingTaskId, setVacuumingTaskId] = useState<string | null>(null)
  const vacuumTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [vacuumX, setVacuumX] = useState(0)
  const taskRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // Use external filter if provided
  const activeFilter = externalFilter ?? filter;

  useEffect(() => {
    const fetchTasks = async () => {
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
            const householdIds = data.data.households.map((h: Household) => h.id)
            q = query(tasksRef, where("householdId", "in", householdIds))
          } else {
            setTasks([])
            return
          }
        } else {
          // For managers, just get tasks from their household
          if (!user.householdId) return
          q = query(tasksRef, where("householdId", "==", user.householdId))
        }

        const querySnapshot = await getDocs(q)
        
        let tasksData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Task[]

        // Filter by householdId if provided
        if (householdId) {
          tasksData = tasksData.filter(task => task.householdId === householdId)
        }
        // Filter by helperId if provided
        if (helperId) {
          tasksData = tasksData.filter(task => task.assignedTo.some(a => a.id === helperId))
        }

        setTasks(tasksData)
      } catch (error) {
        console.error("Error fetching tasks:", error)
        toast({
          title: "Error",
          description: "Failed to load tasks. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchTasks()
  }, [user?.id, user?.householdId, user?.role, toast, helperId, householdId])

  useEffect(() => {
    if (vacuumingTaskId && taskRefs.current[vacuumingTaskId]) {
      const width = taskRefs.current[vacuumingTaskId]?.offsetWidth || 0
      setVacuumX(width - 128) // 128px is the width of the shrimp GIF
    }
  }, [vacuumingTaskId])

  const handleCreateTask = () => {
    router.push("/dashboard/tasks/create")
  }

  const handleEditTask = (taskId: string) => {
    router.push(`/dashboard/tasks/edit/${taskId}`)
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, "tasks", taskId))
      setTasks(tasks.filter((task) => task.id !== taskId))
      toast({
        title: "Task deleted",
        description: "The task has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting task:", error)
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (taskId: string, checked: boolean) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to update tasks.",
        variant: "destructive",
      })
      return
    }

    if (checked) {
      // Measure width before animation
      setVacuumX(0)
      const el = taskRefs.current[taskId]
      const width = el?.offsetWidth || 0
      // Set the end position for the vacuum
      setTimeout(() => setVacuumX(width - 128), 10) // slight delay to ensure render
      setVacuumingTaskId(taskId)
      if (vacuumTimeoutRef.current) clearTimeout(vacuumTimeoutRef.current)
      vacuumTimeoutRef.current = setTimeout(async () => {
        await updateTaskStatus(taskId, checked)
        setVacuumingTaskId(null)
        setVacuumX(0)
      }, 3000)
    } else {
      // Unchecking: update immediately, no animation
      await updateTaskStatus(taskId, checked)
    }
  }

  const updateTaskStatus = async (taskId: string, checked: boolean) => {
    if (!user) return;
    try {
      const taskRef = doc(db, "tasks", taskId)
      const updateData = {
        status: checked ? "completed" as const : "pending" as const,
        completedBy: checked ? user.id : null,
        completedAt: checked ? new Date().toISOString() : null
      }
      await updateDoc(taskRef, updateData)
      setTasks(tasks => tasks.map(task =>
        task.id === taskId ? { ...task, ...updateData } : task
      ))
      toast({
        title: checked ? "Task completed" : "Task marked as pending",
        description: checked
          ? "The task has been marked as completed."
          : "The task has been marked as pending.",
      })
    } catch (error) {
      console.error("Error updating task status:", error)
      toast({
        title: "Error",
        description: "You don't have permission to update this task.",
        variant: "destructive",
      })
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (activeFilter === "all") return true
    if (activeFilter === "completed") return task.status === "completed"
    if (activeFilter === "pending") return task.status === "pending"
    if (activeFilter === "in-progress") return task.status === "in-progress"
    if (activeFilter === "assigned-to-me") return task.assignedTo.some(assignee => assignee.id === user?.id)
    if (activeFilter === "high-priority") return task.priority === "high"
    if (activeFilter === "medium-priority") return task.priority === "medium"
    if (activeFilter === "low-priority") return task.priority === "low"
    return true
  }).sort((a, b) => {
    // Sort by time when showing all tasks
    if (activeFilter === "all") {
      return new Date(a.dueTime).getTime() - new Date(b.dueTime).getTime()
    }
    return 0
  })

  const formatDueTime = (dueTime: string) => {
    const date = new Date(dueTime)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "warning"
      case "low":
        return "secondary"
      default:
        return "secondary"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        {externalFilter === undefined && (
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter tasks" />
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
        )}

        {user?.role === "manager" && (
          <Button onClick={handleCreateTask}>
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </Button>
        )}
      </div>

      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="rounded-full bg-primary/10 p-3">
              <AlertCircle className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No tasks found</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {activeFilter === "all"
                ? "There are no tasks for today. Create a new task to get started."
                : `There are no ${activeFilter.replace("-", " ")} tasks.`}
            </p>
            {user?.role === "manager" && (
              <Button className="mt-4" onClick={handleCreateTask}>
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div
                  ref={el => { taskRefs.current[task.id] = el; }}
                  className={`flex items-start p-4 gap-4 transition-all relative ${vacuumingTaskId === task.id ? 'animate-suck' : ''}`}
                >
                  <Checkbox
                    checked={task.status === "completed"}
                    onCheckedChange={(checked) => handleStatusChange(task.id, checked === true)}
                    className="mt-1"
                    disabled={vacuumingTaskId === task.id}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3
                        className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}
                      >
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(task.priority) as any}>{task.priority}</Badge>
                        {task.status === "in-progress" && (
                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                            <Clock className="mr-1 h-3 w-3" />
                            In Progress
                          </Badge>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">More</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {user?.role === "manager" && (
                              <DropdownMenuItem onClick={() => handleEditTask(task.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {user?.role === "manager" && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex -space-x-2">
                          {task.assignedTo.map((assignee) => (
                            <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background">
                              <AvatarFallback className="text-xs">{getInitials(assignee.name)}</AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <span>
                          {task.assignedTo.map(a => a.name).join(", ")}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-1 h-4 w-4" />
                        Due by {formatDueTime(task.dueTime)}
                      </div>
                    </div>
                  </div>
                  {vacuumingTaskId === task.id && (
                    <img
                      src="/vacuum-shrimp.gif"
                      alt="Vacuuming shrimp"
                      className="w-32 h-32 absolute left-0 bottom-[-10px] z-20"
                      style={{
                        transform: `translateX(${vacuumX}px)`,
                        transition: vacuumingTaskId === task.id ? 'transform 3s linear' : undefined,
                      }}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
