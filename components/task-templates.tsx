"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { TaskTemplate, DEFAULT_TEMPLATE_CATEGORIES, templateToTask } from "@/lib/task-templates"
import { addDoc, collection } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Clock, Edit, Plus, Trash2, Users, Zap } from "lucide-react"

interface TaskTemplatesProps {
  onTaskCreated?: () => void
}

export function TaskTemplates({ onTaskCreated }: TaskTemplatesProps) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showUseDialog, setShowUseDialog] = useState(false)
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
  const [householdMembers, setHouseholdMembers] = useState<any[]>([])
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const { user } = useAuth()
  const { toast } = useToast()

  // Form state for creating new templates
  const [newTemplate, setNewTemplate] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium" as const,
    estimatedTime: "",
    room: "",
    supplies: [""],
    steps: [""]
  })

  useEffect(() => {
    if (user?.householdId) {
      fetchTemplates()
      fetchHouseholdMembers()
    }
  }, [user?.householdId])

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`/api/task-templates?householdId=${user?.householdId}`)
      const data = await response.json()
      
      if (data.success) {
        setTemplates(data.templates)
      } else {
        // If no templates exist, initialize default ones
        await initializeDefaultTemplates()
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
    } finally {
      setLoading(false)
    }
  }

  const initializeDefaultTemplates = async () => {
    try {
      const response = await fetch("/api/task-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdId: user?.householdId,
          userId: user?.id
        })
      })
      
      if (response.ok) {
        fetchTemplates() // Refresh the list
      }
    } catch (error) {
      console.error("Error initializing templates:", error)
    }
  }

  const fetchHouseholdMembers = async () => {
    if (!user?.householdId) return
    
    try {
      const response = await fetch(`/api/household?householdId=${user.householdId}`)
      const data = await response.json()
      
      if (data.success) {
        setHouseholdMembers(data.data.members || [])
      }
    } catch (error) {
      console.error("Error fetching household members:", error)
    }
  }

  const handleUseTemplate = async () => {
    if (!selectedTemplate || selectedAssignees.length === 0) return

    try {
      const taskData = templateToTask(selectedTemplate, selectedAssignees)
      taskData.householdId = user?.householdId
      taskData.createdBy = user?.id

      await addDoc(collection(db, "tasks"), taskData)

      toast({
        title: "Task created",
        description: `"${selectedTemplate.title}" has been created from template`,
      })

      setShowUseDialog(false)
      setSelectedTemplate(null)
      setSelectedAssignees([])
      onTaskCreated?.()
    } catch (error) {
      console.error("Error creating task from template:", error)
      toast({
        title: "Error",
        description: "Failed to create task from template",
        variant: "destructive",
      })
    }
  }

  const handleCreateTemplate = async () => {
    if (!newTemplate.title || !newTemplate.category) return

    try {
      const response = await fetch("/api/task-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTemplate,
          householdId: user?.householdId,
          userId: user?.id,
          estimatedTime: newTemplate.estimatedTime ? parseInt(newTemplate.estimatedTime) : undefined,
          supplies: newTemplate.supplies.filter(s => s.trim()),
          steps: newTemplate.steps.filter(s => s.trim())
        })
      })

      if (response.ok) {
        toast({
          title: "Template created",
          description: "Your new task template has been saved",
        })
        setShowCreateDialog(false)
        setNewTemplate({
          title: "",
          description: "",
          category: "",
          priority: "medium",
          estimatedTime: "",
          room: "",
          supplies: [""],
          steps: [""]
        })
        fetchTemplates()
      }
    } catch (error) {
      console.error("Error creating template:", error)
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      })
    }
  }

  const filteredTemplates = templates.filter(template => 
    filterCategory === "all" || template.category === filterCategory
  )

  const getCategoryInfo = (categoryId: string) => {
    return DEFAULT_TEMPLATE_CATEGORIES.find(cat => cat.id === categoryId)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800"
      case "medium": return "bg-yellow-100 text-yellow-800"
      case "low": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <Card className="min-h-[400px]">
        <CardContent className="flex items-center justify-center py-20 px-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading templates...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Task Templates</h2>
          <p className="text-muted-foreground">Quick-start common household tasks</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg md:max-w-2xl max-h-[75vh] w-[95vw] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Create New Task Template</DialogTitle>
              <DialogDescription>
                Create a reusable template for common household tasks
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 flex-1 overflow-y-auto px-6">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newTemplate.title}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Kitchen Deep Clean"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={newTemplate.category} onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_TEMPLATE_CATEGORIES.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this task involves..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newTemplate.priority} onValueChange={(value: any) => setNewTemplate(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedTime">Estimated Time (minutes)</Label>
                  <Input
                    id="estimatedTime"
                    type="number"
                    value={newTemplate.estimatedTime}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, estimatedTime: e.target.value }))}
                    placeholder="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room">Room/Area</Label>
                  <Input
                    id="room"
                    value={newTemplate.room}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, room: e.target.value }))}
                    placeholder="e.g., Kitchen"
                  />
                </div>
              </div>

              <Tabs defaultValue="supplies" className="w-full mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="supplies">Supplies</TabsTrigger>
                  <TabsTrigger value="steps">Steps</TabsTrigger>
                </TabsList>
                <TabsContent value="supplies" className="space-y-4">
                  <div className="space-y-3">
                    <Label>Required Supplies</Label>
                    {newTemplate.supplies.map((supply, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={supply}
                          onChange={(e) => {
                            const newSupplies = [...newTemplate.supplies]
                            newSupplies[index] = e.target.value
                            setNewTemplate(prev => ({ ...prev, supplies: newSupplies }))
                          }}
                          placeholder="e.g., All-purpose cleaner"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newSupplies = newTemplate.supplies.filter((_, i) => i !== index)
                            setNewTemplate(prev => ({ ...prev, supplies: newSupplies }))
                          }}
                          className="shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewTemplate(prev => ({ ...prev, supplies: [...prev.supplies, ""] }))}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Supply
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="steps" className="space-y-4">
                  <div className="space-y-3">
                    <Label>Task Steps</Label>
                    {newTemplate.steps.map((step, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={step}
                          onChange={(e) => {
                            const newSteps = [...newTemplate.steps]
                            newSteps[index] = e.target.value
                            setNewTemplate(prev => ({ ...prev, steps: newSteps }))
                          }}
                          placeholder={`Step ${index + 1}`}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newSteps = newTemplate.steps.filter((_, i) => i !== index)
                            setNewTemplate(prev => ({ ...prev, steps: newSteps }))
                          }}
                          className="shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewTemplate(prev => ({ ...prev, steps: [...prev.steps, ""] }))}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Step
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <DialogFooter className="mt-6 flex-shrink-0 px-6 pb-6">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate}>
                Create Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Label>Filter by category:</Label>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {DEFAULT_TEMPLATE_CATEGORIES.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => {
            const categoryInfo = getCategoryInfo(template.category)
            return (
              <Card key={template.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-2 hover:border-primary/20">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{categoryInfo?.icon}</span>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg leading-tight">{template.title}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {template.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={`${getPriorityColor(template.priority)} ml-2`}>
                      {template.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {template.estimatedTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {template.estimatedTime} min
                      </div>
                    )}
                    {template.room && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {template.room}
                      </div>
                    )}
                  </div>

                  {template.supplies && template.supplies.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Required Supplies:</Label>
                      <div className="flex flex-wrap gap-2">
                        {template.supplies.slice(0, 3).map((supply, index) => (
                          <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                            {supply}
                          </Badge>
                        ))}
                        {template.supplies.length > 3 && (
                          <Badge variant="secondary" className="text-xs px-2 py-1">
                            +{template.supplies.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedTemplate(template)
                        setShowUseDialog(true)
                      }}
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Use Template
                    </Button>
                    {!template.isDefault && (
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <Card className="min-h-[400px]">
            <CardContent className="flex items-center justify-center py-20 px-12">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">No templates found</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Template
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Use Template Dialog */}
      <Dialog open={showUseDialog} onOpenChange={setShowUseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Use Template: {selectedTemplate?.title}</DialogTitle>
            <DialogDescription>
              Assign this task to household members and set a due date
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Assign to:</Label>
              <div className="space-y-2">
                {householdMembers
                  .filter(member => member.role === "helper")
                  .map((member) => (
                    <label key={member.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedAssignees.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAssignees(prev => [...prev, member.id])
                          } else {
                            setSelectedAssignees(prev => prev.filter(id => id !== member.id))
                          }
                        }}
                        className="rounded"
                      />
                      <span>{member.name || member.email}</span>
                    </label>
                  ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUseDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUseTemplate}
              disabled={selectedAssignees.length === 0}
            >
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 