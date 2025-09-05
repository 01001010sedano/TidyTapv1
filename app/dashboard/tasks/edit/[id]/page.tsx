"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { collection, doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function EditTaskPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { user } = useAuth()
  const taskId = params?.id as string

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [category, setCategory] = useState("")
  const [assignedTo, setAssignedTo] = useState<string[]>([])
  const [dueDate, setDueDate] = useState("")
  const [dueTime, setDueTime] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [householdMembers, setHouseholdMembers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [repeatFrequency, setRepeatFrequency] = useState("")
  const [dayOfWeek, setDayOfWeek] = useState<string[]>([])
  const [dayOfMonth, setDayOfMonth] = useState<number | "">("")

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) return
      setIsLoading(true)
      try {
        const taskRef = doc(db, "tasks", taskId)
        const taskSnap = await getDoc(taskRef)
        if (taskSnap.exists()) {
          const data = taskSnap.data()
          setTitle(data.title || "")
          setDescription(data.description || "")
          setPriority(data.priority || "medium")
          setCategory(data.category || "")
          setAssignedTo((data.assignedTo || []).map((a: any) => a.id))
          if (data.dueTime) {
            const dt = new Date(data.dueTime)
            setDueDate(dt.toISOString().slice(0, 10))
            setDueTime(dt.toISOString().slice(11, 16))
          }
          if (data.repeat) {
            setRepeatFrequency(data.repeat.frequency || "")
            if (data.repeat.frequency === "weekly") setDayOfWeek(data.repeat.dayOfWeek || [])
            if (data.repeat.frequency === "monthly") setDayOfMonth(data.repeat.dayOfMonth || "")
          }
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to load task info.", variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
    fetchTask()
  }, [taskId, toast])

  useEffect(() => {
    const fetchHouseholdMembers = async () => {
      if (!user?.householdId) return
      try {
        const response = await fetch(`/api/household?householdId=${user.householdId}`)
        const data = await response.json()
        if (data.success) {
          setHouseholdMembers((data.data.members || []).filter((m: any) => m.role === "helper"))
        }
      } catch {}
    }
    fetchHouseholdMembers()
  }, [user?.householdId])

  const handleAssigneeChange = (memberId: string) => {
    setAssignedTo(prev => prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId])
  }
  const handleRemoveAssignee = (memberId: string) => {
    setAssignedTo(prev => prev.filter(id => id !== memberId))
  }
  const getMemberName = (memberId: string) => {
    const member = householdMembers.find(m => m.id === memberId)
    return member?.name || member?.email || 'Unknown'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.householdId || assignedTo.length === 0) {
      toast({ title: "Validation Error", description: "Please assign the task to at least one member.", variant: "destructive" })
      return
    }
    setIsSubmitting(true)
    try {
      const dueDateTime = new Date(`${dueDate}T${dueTime}`)
      let repeat: any = null
      if (repeatFrequency === "daily") repeat = { frequency: "daily" }
      else if (repeatFrequency === "weekly" && dayOfWeek.length > 0) repeat = { frequency: "weekly", dayOfWeek }
      else if (repeatFrequency === "monthly" && dayOfMonth) repeat = { frequency: "monthly", dayOfMonth }
      const taskData = {
        title,
        description,
        priority,
        category,
        assignedTo: assignedTo.map(id => ({ id, name: getMemberName(id) })),
        dueTime: dueDateTime.toISOString(),
        repeat: repeat || null,
      }
      await updateDoc(doc(db, "tasks", taskId), taskData)
      toast({ title: "Task updated", description: "The task has been updated successfully." })
      router.push("/dashboard")
    } catch (error) {
      toast({ title: "Error", description: "Failed to update task. Please try again.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container p-4 md:p-6">
          <div className="flex items-center justify-center h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="container p-4 md:p-6">
        <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Edit Task</CardTitle>
            <CardDescription>Update your task details</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter task title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter task description" required />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Chore, Kitchen, Dog-care" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assign To (Select multiple)</Label>
                <Select value={assignedTo[assignedTo.length - 1] || ""} onValueChange={handleAssigneeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select helpers" />
                  </SelectTrigger>
                  <SelectContent>
                    {householdMembers.map((member: any) => (
                      <SelectItem key={member.id} value={member.id} className="flex items-center justify-between">
                        <span>{member.name || member.email}</span>
                        <span className="text-xs text-muted-foreground ml-2">{member.role === "helper" ? "(helper)" : "(manager)"}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {assignedTo.length > 0 && (
                  <ScrollArea className="h-20 w-full rounded-md border p-2">
                    <div className="flex flex-wrap gap-2">
                      {assignedTo.map(memberId => {
                        const member = householdMembers.find(m => m.id === memberId)
                        if (!member) return null
                        return (
                          <Badge key={memberId} variant="secondary" className="flex items-center gap-1">
                            {member.name || member.email}
                            <button type="button" onClick={() => handleRemoveAssignee(memberId)} className="ml-1 rounded-full hover:bg-destructive/20">
                              <X className="h-3 w-3" />
                              <span className="sr-only">Remove</span>
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  </ScrollArea>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input id="dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueTime">Due Time</Label>
                  <Input id="dueTime" type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="block mt-4 font-semibold">Repeat</Label>
                <select value={repeatFrequency} onChange={e => setRepeatFrequency(e.target.value)} className="w-full border p-2 rounded-md">
                  <option value="">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                {repeatFrequency === 'weekly' && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                      <label key={day} className="flex items-center gap-1">
                        <input type="checkbox" checked={dayOfWeek.includes(day)} onChange={() => setDayOfWeek(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])} />
                        {day.slice(0, 3)}
                      </label>
                    ))}
                  </div>
                )}
                {repeatFrequency === 'monthly' && (
                  <input type="number" value={dayOfMonth} onChange={e => setDayOfMonth(Number(e.target.value))} className="w-full mt-2 border p-2 rounded-md" placeholder="Enter day of month (e.g. 15)" />
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>) : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
} 