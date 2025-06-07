"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Copy, Loader2, Trash2, UserPlus } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { getDoc, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [householdCode, setHouseholdCode] = useState("")
  const [isCheckingCode, setIsCheckingCode] = useState(false)
  const [codeValid, setCodeValid] = useState<boolean | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingDocuments, setIsCreatingDocuments] = useState(false)
  const [householdMembers, setHouseholdMembers] = useState<Array<{
    id: string;
    name: string | null;
    email: string | null;
    role: "manager" | "helper";
  }>>([])
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null)
  const [userHouseholds, setUserHouseholds] = useState<Array<{
    id: string;
    name: string;
    inviteCode: string;
    manager: {
      id: string;
      name: string | null;
      email: string | null;
    };
  }>>([])

  const createInitialDocuments = async () => {
    if (!user) return

    setIsCreatingDocuments(true)
    try {
      const response = await fetch("/api/create-initial-documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Your household has been created. Please refresh the page.",
        })
        // Refresh the page after a short delay
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        throw new Error(data.error || "Failed to create documents")
      }
    } catch (error) {
      console.error("Error creating documents:", error)
      toast({
        title: "Error",
        description: "Failed to create household documents. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingDocuments(false)
    }
  }

  // Fetch household data when component mounts
  useEffect(() => {
    const fetchHouseholdData = async () => {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        // For managers, just fetch their household
        if (user.role === "manager" && user.householdId) {
          const response = await fetch(`/api/household?householdId=${user.householdId}`)
          const data = await response.json()

          if (data.success) {
            setHouseholdCode(data.data.inviteCode || "")
            setHouseholdMembers(data.data.members || [])
          } else {
            throw new Error(data.error)
          }
        } 
        // For helpers, fetch all households they're part of
        else if (user.role === "helper") {
          console.log('Fetching households for helper:', user.id) // Debug log
          const response = await fetch(`/api/user-households?userId=${user.id}`)
          const data = await response.json()

          if (data.success) {
            console.log('Received households:', data.data.households) // Debug log
            setUserHouseholds(data.data.households || [])
          } else {
            throw new Error(data.error)
          }
        }
      } catch (error) {
        console.error("Error fetching household data:", error)
        toast({
          title: "Error",
          description: "Failed to load household data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchHouseholdData()
  }, [user?.id, user?.householdId, user?.role, toast])

  const handleRemoveMember = async (memberId: string) => {
    if (!user?.householdId || user.role !== "manager") return

    try {
      const householdRef = doc(db, "households", user.householdId)
      const householdDoc = await getDoc(householdRef)
      
      if (householdDoc.exists()) {
        const data = householdDoc.data()
        const updatedMembers = data.members.filter((id: string) => id !== memberId)
        
        await updateDoc(householdRef, {
          members: updatedMembers
        })

        // Update the UI
        setHouseholdMembers(prev => prev.filter(member => member.id !== memberId))
        
        toast({
          title: "Member removed",
          description: "The household member has been removed successfully.",
        })
      }
    } catch (error) {
      console.error("Error removing member:", error)
      toast({
        title: "Error",
        description: "Failed to remove member. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCopyCode = () => {
    if (!householdCode) return
    
    navigator.clipboard.writeText(householdCode)
    toast({
      title: "Code copied",
      description: "Household code copied to clipboard.",
    })
  }

  const handleLeaveHousehold = async (householdId: string) => {
    if (!user?.id) return

    try {
      const response = await fetch("/api/leave-household", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          householdId: householdId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Remove the household from the list
        setUserHouseholds(prev => prev.filter(h => h.id !== householdId))
        setSelectedHouseholdId(null)
        
        toast({
          title: "Success",
          description: "You have left the household.",
        })
      } else {
        throw new Error(data.error || "Failed to leave household")
      }
    } catch (error) {
      console.error("Error leaving household:", error)
      toast({
        title: "Error",
        description: "Failed to leave household. Please try again.",
        variant: "destructive",
      })
    }
  }

  const checkHouseholdCode = async () => {
    if (!householdCode) return

    setIsCheckingCode(true)
    setCodeValid(null)

    try {
      const response = await fetch("/api/check-household-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ householdCode: householdCode.trim() }),
      })

      const data = await response.json()

      if (data.valid) {
        setCodeValid(true)
        toast({
          title: "Valid household code",
          description: `You'll join ${data.householdName}`,
        })
      } else {
        setCodeValid(false)
        toast({
          title: "Invalid household code",
          description: data.message || "Please check the code and try again",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error checking code:", error)
      setCodeValid(false)
      toast({
        title: "Error checking code",
        description: "There was a problem verifying the household code.",
        variant: "destructive",
      })
    } finally {
      setIsCheckingCode(false)
    }
  }

  const handleJoinHousehold = async () => {
    if (!user?.id || !householdCode || !codeValid) return

    setIsJoining(true)
    try {
      // First verify and join the new household
      const response = await fetch("/api/check-household-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          householdCode: householdCode.trim(),
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }),
      })

      const data = await response.json()

      if (data.valid) {
        // Fetch the updated list of households
        const householdsResponse = await fetch(`/api/user-households?userId=${user.id}`)
        const householdsData = await householdsResponse.json()

        if (householdsData.success) {
          setUserHouseholds(householdsData.data.households || [])
          // Reset the form
          setHouseholdCode("")
          setCodeValid(null)
          
          toast({
            title: "Success",
            description: "You've joined the new household!",
          })
        } else {
          throw new Error("Failed to update households list")
        }
      } else {
        throw new Error(data.message || "Failed to join household")
      }
    } catch (error) {
      console.error("Error joining household:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join household",
        variant: "destructive",
      })
    } finally {
      setIsJoining(false)
    }
  }

  const renderHouseholdContent = () => {
    const isHelper = user?.role === "helper"

    if (isHelper) {
      return (
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center p-6">
                <Loader2 className="h-6 w-6 animate-spin" />
              </CardContent>
            </Card>
          ) : userHouseholds.length > 0 ? (
            <>
              <div className="grid gap-4 grid-cols-1">
                {userHouseholds.map((household) => (
                  <Card key={household.id}>
                    <CardHeader>
                      <CardTitle>{household.name || "Household"}</CardTitle>
                      <CardDescription>Managed by {household.manager.name || household.manager.email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <Label>Manager Name</Label>
                          <p className="text-sm text-muted-foreground">{household.manager.name}</p>
                        </div>
                        <div>
                          <Label>Manager Email</Label>
                          <p className="text-sm text-muted-foreground">{household.manager.email}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="destructive" 
                        onClick={() => {
                          setSelectedHouseholdId(household.id)
                          setShowLeaveDialog(true)
                        }} 
                        className="w-full"
                      >
                        Leave Household
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Join Another Household</span>
                </div>
              </div>
            </>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Join {userHouseholds.length === 0 ? "a" : "Another"} Household</CardTitle>
              <CardDescription>Enter a household code to join {userHouseholds.length === 0 ? "a" : "another"} household</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-household-code">Household Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="new-household-code"
                      placeholder="Enter the household code (e.g. TIDY-1234ABCD)"
                      value={householdCode}
                      onChange={(e) => {
                        setHouseholdCode(e.target.value)
                        setCodeValid(null)
                      }}
                      className={
                        codeValid === true ? "border-green-500" : codeValid === false ? "border-red-500" : ""
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={checkHouseholdCode}
                      disabled={isCheckingCode || !householdCode}
                    >
                      {isCheckingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                    </Button>
                  </div>
                  {codeValid === false && (
                    <p className="text-sm text-red-500">Invalid household code. Please check and try again.</p>
                  )}
                  {codeValid === true && <p className="text-sm text-green-500">Valid household code!</p>}
                </div>
                <Button
                  className="w-full"
                  onClick={handleJoinHousehold}
                  disabled={!codeValid || isJoining}
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining household...
                    </>
                  ) : (
                    "Join Household"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Leave Household</DialogTitle>
                <DialogDescription>
                  Are you sure you want to leave this household? You'll lose access to all shared tasks.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowLeaveDialog(false)}>Cancel</Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    if (selectedHouseholdId) {
                      handleLeaveHousehold(selectedHouseholdId)
                    }
                    setShowLeaveDialog(false)
                  }}
                >
                  Yes, leave
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Invite Code</CardTitle>
            <CardDescription>Share this code with people you want to invite to your household. This is your permanent household code.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input 
                value={isLoading ? "Loading..." : householdCode} 
                readOnly 
                className="font-mono"
                disabled={isLoading}
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleCopyCode}
                disabled={isLoading || !householdCode}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="sr-only">Copy code</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Household Members</CardTitle>
            <CardDescription>Manage the members of your household</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  {user?.role === "manager" && <TableHead className="w-[100px]">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {householdMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <span className="capitalize">{member.role}</span>
                    </TableCell>
                    {user?.role === "manager" && (
                      <TableCell>
                        {member.role !== "manager" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          {user?.role === "manager" && (
            <CardFooter>
              <Button className="w-full sm:w-auto">
                <UserPlus className="mr-2 h-4 w-4" />
                Invite New Member
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="container p-4 md:p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account and household settings</p>
        </div>

        {!user?.householdId && user?.role === "manager" && (
          <Card>
            <CardHeader>
              <CardTitle>Setup Required</CardTitle>
              <CardDescription>Your household documents need to be created.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={createInitialDocuments}
                disabled={isCreatingDocuments}
              >
                {isCreatingDocuments ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Documents...
                  </>
                ) : (
                  "Create Household Documents"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="household" className="space-y-4">
          <TabsList>
            <TabsTrigger value="household">Household</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="household" className="space-y-4">
            {renderHouseholdContent()}
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Choose your display mode</CardDescription>
              </CardHeader>
              <CardContent>
                <ThemePreference />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue={user?.name || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={user?.email || ""} />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Update Password</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Task Reminders</Label>
                    <p className="text-sm text-muted-foreground">Receive reminders for upcoming tasks</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="task-reminders" className="sr-only">
                      Task Reminders
                    </Label>
                    <Input id="task-reminders" type="time" className="w-24" defaultValue="09:00" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Task Assignments</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications when you are assigned a task</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="task-assignments" className="sr-only">
                      Task Assignments
                    </Label>
                    <Input id="task-assignments" type="checkbox" className="h-4 w-4" defaultChecked />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Task Completions</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications when a task is completed</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="task-completions" className="sr-only">
                      Task Completions
                    </Label>
                    <Input id="task-completions" type="checkbox" className="h-4 w-4" defaultChecked />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Preferences</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

function ThemePreference() {
  const { theme, setTheme } = useTheme();
  return (
    <RadioGroup
      value={theme}
      onValueChange={setTheme}
      className="flex gap-6"
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="light" id="theme-light" />
        <Label htmlFor="theme-light">Light</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="dark" id="theme-dark" />
        <Label htmlFor="theme-dark">Dark</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="system" id="theme-system" />
        <Label htmlFor="theme-system">System</Label>
      </div>
    </RadioGroup>
  );
}
