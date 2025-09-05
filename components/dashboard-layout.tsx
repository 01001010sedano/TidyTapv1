"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Calendar, ChevronDown, ClipboardList, Home, Loader2, LogOut, Menu, Settings, User } from "lucide-react"
import { FaBroom } from "react-icons/fa"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import Link from "next/link"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { HelpCircle } from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted && !loading && !user) {
      router.push("/auth/login")
    }
  }, [isMounted, loading, user, router])

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (loading || !isMounted || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Tasks", href: "/dashboard/tasks", icon: ClipboardList },
    { name: "Templates", href: "/dashboard/templates", icon: FaBroom },
    { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
    { name: "Task Log", href: "/dashboard/log", icon: Bell },
  ]

  const userInitials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U"

  const howToInstructions = {
    manager: [
      "Invite helpers to your household using the unique code found in your settings.",
      "Create tasks by clicking the '+ Create Task' button on the dashboard or tasks page.",
      "When creating a task, use the 'AI Help' button to get suggestions for task details.",
      "For any task, click the three dots (⋯) menu and select 'Help' to get AI-powered, step-by-step instructions for completing the task.",
      "Assign tasks to helpers and set due dates or recurrence as needed.",
      "Track task progress and completion rates in the dashboard.",
      "Use the Task Log to review completed and pending tasks for accountability.",
      "Manage helpers and household settings from the settings page."
    ],
    helper: [
      "Join a household using the invite code provided by your manager.",
      "View your assigned tasks on the dashboard or tasks page.",
      "For any task, click the three dots (⋯) menu and select 'Help' to get AI-powered, step-by-step instructions for completing the task.",
      "Click on a task to see details and use the 'Shrimpy's Tips' AI helper for additional guidance.",
      "Mark tasks as 'In Progress' or 'Completed' as you work on them.",
      "Track your progress and see upcoming or overdue tasks in the dashboard.",
      "Communicate with your manager if you need clarification or help with tasks."
    ]
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Mobile header */}
      <header className="sticky top-0 z-40 border-b bg-card lg:hidden">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 sm:max-w-sm">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex items-center gap-2 mb-8">
                  <FaBroom className="h-6 w-6 text-primary" />
                  <span className="text-xl font-bold">TidyTap</span>
                </div>
                <nav className="flex flex-col gap-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary hover:text-secondary-foreground transition-colors"
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  ))}
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary hover:text-secondary-foreground transition-colors mt-2">
                        <HelpCircle className="h-5 w-5" />
                        How to?
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>How to use TidyTap ({user.role === "manager" ? "Manager" : "Helper"})</DialogTitle>
                        <DialogDescription>
                          Step-by-step guide for using TidyTap:
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-2">
                        <ol className="text-left" style={{ listStyle: 'decimal', paddingLeft: '1.5rem' }}>
                          {howToInstructions[user.role].map((item, idx) => (
                            <li
                              key={idx}
                              className="mb-5 last:mb-0 bg-muted/60 rounded-lg px-4 py-3 text-base shadow-sm"
                              style={{
                                background: 'rgba(240, 240, 255, 0.7)',
                                borderRadius: '0.75rem',
                                fontSize: '1.08rem',
                                lineHeight: 1.6,
                              }}
                            >
                              {item}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </DialogContent>
                  </Dialog>
                </nav>
              </SheetContent>
            </Sheet>
            <Link href="/dashboard" className="flex items-center gap-2">
              <FaBroom className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold hidden sm:inline-block">TidyTap</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    3
                  </span>
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-auto">
                  {[1, 2, 3].map((i) => (
                    <DropdownMenuItem key={i} className="cursor-pointer py-3">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium">Task reminder</p>
                        <p className="text-xs text-muted-foreground">
                          Don't forget to complete "Vacuum living room" by 5 PM
                        </p>
                        <p className="text-xs text-muted-foreground">{i * 10} minutes ago</p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline-block">{user.name}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings?tab=profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Desktop layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r">
          <div className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto">
              <div className="flex flex-col gap-6 px-4 py-6">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <FaBroom className="h-6 w-6 text-primary" />
                  <span className="text-xl font-bold">TidyTap</span>
                </Link>
                <nav className="flex flex-col gap-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary hover:text-secondary-foreground transition-colors"
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  ))}
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary hover:text-secondary-foreground transition-colors mt-2">
                        <HelpCircle className="h-5 w-5" />
                        How to?
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>How to use TidyTap ({user.role === "manager" ? "Manager" : "Helper"})</DialogTitle>
                        <DialogDescription>
                          Step-by-step guide for using TidyTap:
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-2">
                        <ol className="text-left" style={{ listStyle: 'decimal', paddingLeft: '1.5rem' }}>
                          {howToInstructions[user.role].map((item, idx) => (
                            <li
                              key={idx}
                              className="mb-5 last:mb-0 bg-muted/60 rounded-lg px-4 py-3 text-base shadow-sm"
                              style={{
                                background: 'rgba(240, 240, 255, 0.7)',
                                borderRadius: '0.75rem',
                                fontSize: '1.08rem',
                                lineHeight: 1.6,
                              }}
                            >
                              {item}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </DialogContent>
                  </Dialog>
                </nav>
              </div>
            </div>
            <div className="shrink-0 border-t p-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-sm">
                      <span>{user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {user.role === "manager" ? "Home Manager" : "Helper"}
                      </span>
                    </div>
                    <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings?tab=profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
