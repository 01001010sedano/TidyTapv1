"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { collection, addDoc, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import axios from "axios"

type HouseholdMember = {
  id: string
  name: string | null
  email: string | null
  role: "manager" | "helper"
}

export default function CreateTaskPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [category, setCategory] = useState("")
  const [tip, setTip] = useState("")
  const [assignedTo, setAssignedTo] = useState<string[]>([])
  const [dueDate, setDueDate] = useState("")
  const [dueTime, setDueTime] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isShrimpyLoading, setIsShrimpyLoading] = useState(false)
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [repeatFrequency, setRepeatFrequency] = useState("")
  const [dayOfWeek, setDayOfWeek] = useState("")
  const [dayOfMonth, setDayOfMonth] = useState<number | "">("")

  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const fetchHouseholdMembers = async () => {
      if (!user?.householdId) return

      try {
        const response = await fetch(`/api/household?householdId=${user.householdId}`)
        const data = await response.json()

        if (data.success) {
          // Only include members with helper role
          const helpers = (data.data.members || []).filter((member: HouseholdMember) => member.role === "helper")
          setHouseholdMembers(helpers)
        } else {
          throw new Error(data.error)
        }
      } catch (error) {
        console.error("Error fetching household members:", error)
        toast({
          title: "Error",
          description: "Failed to load household members. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchHouseholdMembers()
  }, [user?.householdId, toast])

  const handleAssigneeChange = (memberId: string) => {
    setAssignedTo(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId)
      }
      return [...prev, memberId]
    })
  }

  const handleRemoveAssignee = (memberId: string) => {
    setAssignedTo(prev => prev.filter(id => id !== memberId))
  }

  const getMemberName = (memberId: string) => {
    const member = householdMembers.find(m => m.id === memberId)
    return member?.name || member?.email || 'Unknown'
  }

  const handleShrimpySuggest = async () => {
    if (!title && !description) return;
    setIsShrimpyLoading(true);
    setTip("");
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are Shrimpy, a friendly household AI. When given a task title and description, suggest the most likely priority (Low, Medium, High), a suitable category (Chore, Kitchen, Errand, Dog-care, Personal), and an optional repeat rule (daily, weekly, monthly). Reply ONLY as a clean JSON object."
            },
            {
              role: "user",
              content: `Title: ${title}\nDescription: ${description}`
            }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );
      const data = response.data.choices[0].message.content;
      const parsed = JSON.parse(data);
      if (parsed.priority) setPriority(parsed.priority.toLowerCase());
      if (parsed.category) setCategory(parsed.category);
      if (parsed.repeat) {
        if (parsed.repeat.frequency === "daily") {
          setRepeatFrequency("daily");
          setDayOfWeek("");
          setDayOfMonth("");
        } else if (parsed.repeat.frequency === "weekly" && parsed.repeat.dayOfWeek) {
          setRepeatFrequency("weekly");
          setDayOfWeek(parsed.repeat.dayOfWeek);
          setDayOfMonth("");
        } else if (parsed.repeat.frequency === "monthly" && parsed.repeat.dayOfMonth) {
          setRepeatFrequency("monthly");
          setDayOfMonth(parsed.repeat.dayOfMonth);
          setDayOfWeek("");
        }
      }
      toast({
        title: "Shrimpy filled in some suggestions for you! ✨",
      });
      if (parsed.tip) setTip(parsed.tip);
    } catch (e) {
      setTip("Shrimpy couldn't suggest this time. Try again! 🦐");
    } finally {
      setIsShrimpyLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.householdId || assignedTo.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please assign the task to at least one member.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Combine date and time
      const dueDateTime = new Date(`${dueDate}T${dueTime}`)
      
      // Build repeat object
      let repeat: any = null;
      if (repeatFrequency === "daily") {
        repeat = { frequency: "daily" };
      } else if (repeatFrequency === "weekly" && dayOfWeek) {
        repeat = { frequency: "weekly", dayOfWeek };
      } else if (repeatFrequency === "monthly" && dayOfMonth) {
        repeat = { frequency: "monthly", dayOfMonth };
      }
      // Create task in Firestore with multiple assignees
      const taskData = {
        title,
        description,
        priority,
        category,
        assignedTo: assignedTo.map(id => ({
          id,
          name: getMemberName(id)
        })),
        dueTime: dueDateTime.toISOString(),
        status: "pending",
        householdId: user.householdId,
        createdAt: new Date().toISOString(),
        createdBy: user.id,
        repeat: repeat || null,
      }

      await addDoc(collection(db, "tasks"), taskData)

      toast({
        title: "Task created",
        description: "The task has been created successfully.",
      })

      router.push("/dashboard")
    } catch (error) {
      console.error("Error creating task:", error)
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      })
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
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
            <CardDescription>Add a new task to your household</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter task title"
                    required
                  />
                  <button
                    type="button"
                    className="text-sm text-purple-600 hover:underline"
                    onClick={handleShrimpySuggest}
                    disabled={isShrimpyLoading}
                  >
                    ✨ Let Shrimpy Help
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter task description"
                  required
                />
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
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Chore, Kitchen, Dog-care"
                  />
                </div>
              </div>
              {tip && (
                <p className="text-sm text-muted-foreground mt-2">
                  🦐 Tip from Shrimpy: {tip}
                </p>
              )}

              <div className="space-y-2">
                <Label>Assign To (Select multiple)</Label>
                <Select
                  value={assignedTo[assignedTo.length - 1] || ""}
                  onValueChange={handleAssigneeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select helpers" />
                  </SelectTrigger>
                  <SelectContent>
                    {householdMembers.map((member: HouseholdMember) => (
                      <SelectItem 
                        key={member.id} 
                        value={member.id}
                        className="flex items-center justify-between"
                      >
                        <span>{member.name || member.email}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {member.role === "helper" ? "(helper)" : "(manager)"}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {assignedTo.length > 0 && (
                  <ScrollArea className="h-20 w-full rounded-md border p-2">
                    <div className="flex flex-wrap gap-2">
                      {assignedTo.map((memberId) => {
                        const member = householdMembers.find(m => m.id === memberId)
                        if (!member) return null
                        return (
                          <Badge
                            key={memberId}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {member.name || member.email}
                            <button
                              type="button"
                              onClick={() => handleRemoveAssignee(memberId)}
                              className="ml-1 rounded-full hover:bg-destructive/20"
                            >
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
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueTime">Due Time</Label>
                  <Input
                    id="dueTime"
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="block mt-4 font-semibold">Repeat</Label>
                <select
                  value={repeatFrequency}
                  onChange={(e) => setRepeatFrequency(e.target.value)}
                  className="w-full border p-2 rounded-md"
                >
                  <option value="">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                {repeatFrequency === 'weekly' && (
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                    className="w-full mt-2 border p-2 rounded-md"
                  >
                    <option value="">Select day</option>
                    <option>Monday</option>
                    <option>Tuesday</option>
                    <option>Wednesday</option>
                    <option>Thursday</option>
                    <option>Friday</option>
                    <option>Saturday</option>
                    <option>Sunday</option>
                  </select>
                )}
                {repeatFrequency === 'monthly' && (
                  <input
                    type="number"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(Number(e.target.value))}
                    className="w-full mt-2 border p-2 rounded-md"
                    placeholder="Enter day of month (e.g. 15)"
                  />
                )}
              </div>
            </CardContent>

            <CardFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Task"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}
