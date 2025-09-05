"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Facebook, Loader2 } from "lucide-react"
import { FaBroom } from "react-icons/fa"
import { FcGoogle } from "react-icons/fc"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<"manager" | "helper">("helper")
  const [householdCode, setHouseholdCode] = useState("")
  const [isCheckingCode, setIsCheckingCode] = useState(false)
  const [codeValid, setCodeValid] = useState<boolean | null>(null)
  const [rememberMe, setRememberMe] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)

  const { login, register, loginWithGoogle, loginWithFacebook, user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.replace("/dashboard")
    }
  }, [user, router])

  // Handle initial page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      await login(email, password, rememberMe)
      // Don't navigate here - let the user effect handle it
      toast({
        title: "Login successful",
        description: "Welcome back to TidyTap!",
      })
    } catch (error: any) {
      console.error("Login error:", error)
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state
  if (isPageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <FaBroom size={48} className="text-primary animate-bounce" />
          <h1 className="text-2xl font-bold text-primary">Loading TidyTap...</h1>
        </div>
      </div>
    )
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (role === "helper" && !householdCode) {
        toast({
          title: "Household code required",
          description: "Please enter a household code to join as a helper.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // For helpers, verify the household code first
      if (role === "helper" && householdCode) {
        const response = await fetch("/api/check-household-code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ householdCode: householdCode.trim() }),
        })

        const data = await response.json()

        if (!data.valid) {
          toast({
            title: "Invalid household code",
            description: data.message || "Please enter a valid household code to join.",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
      }

      const result = await register(email, password, name, role, householdCode?.trim())
      
      if (result.success) {
        // Show success message
        toast({
          title: "Account created successfully!",
          description: result.message,
        })
        
        // If it's a manager, show the invite code
        if (result.inviteCode) {
          toast({
            title: "Your Household Code",
            description: `Your permanent household code is: ${result.inviteCode}`,
          })
        }
        
        // Switch to login tab and pre-fill email
        setActiveTab("login")
        setEmail(email)
        setPassword("")
        setName("")
        setRole("helper")
        setHouseholdCode("")
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      toast({
        title: "Registration failed",
        description: error.message || "Please check your information and try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    try {
      setIsSubmitting(true)
      if (provider === "google") {
        await loginWithGoogle(role)
      } else {
        await loginWithFacebook(role)
      }
      toast({
        title: "Login successful",
        description: "Welcome to TidyTap!",
      })
      router.push("/dashboard")
    } catch (error: any) {
      toast({
        title: `${provider} login failed`,
        description: error.message || "An error occurred during login.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleForgotPassword = () => {
    router.push("/auth/forgot-password")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <FaBroom size={32} className="text-primary" />
          <h1 className="text-3xl font-bold text-primary">TidyTap</h1>
        </div>

        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>Login to manage your household tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Button
                        variant="link"
                        className="p-0 h-auto text-xs"
                        onClick={handleForgotPassword}
                        type="button"
                      >
                        Forgot password?
                      </Button>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                    />
                    <Label htmlFor="remember" className="text-sm">
                      Remember me
                    </Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full">
                  <Button
                    variant="outline"
                    onClick={() => handleSocialLogin("google")}
                    type="button"
                    disabled={isSubmitting}
                  >
                    <FcGoogle className="mr-2 h-4 w-4" />
                    Google
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSocialLogin("facebook")}
                    type="button"
                    disabled={isSubmitting}
                  >
                    <Facebook className="mr-2 h-4 w-4 text-blue-600" />
                    Facebook
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Create an account</CardTitle>
                <CardDescription>Join TidyTap to manage or help with household tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <Input
                      id="register-name"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>I am a:</Label>
                    <RadioGroup
                      value={role}
                      onValueChange={(value) => {
                        setRole(value as "manager" | "helper")
                        setCodeValid(null)
                      }}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="manager" id="manager" />
                        <Label htmlFor="manager">Home Manager</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="helper" id="helper" />
                        <Label htmlFor="helper">Helper</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {role === "helper" && (
                    <div className="space-y-2">
                      <Label htmlFor="household-code">Household Code</Label>
                      <div className="flex gap-2">
                        <Input
                          id="household-code"
                          placeholder="Enter the permanent household code (e.g. TIDY-1234ABCD)"
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
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || (role === "helper" && !householdCode)}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full">
                  <Button
                    variant="outline"
                    onClick={() => handleSocialLogin("google")}
                    type="button"
                    disabled={isSubmitting}
                  >
                    <FcGoogle className="mr-2 h-4 w-4" />
                    Google
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSocialLogin("facebook")}
                    type="button"
                    disabled={isSubmitting}
                  >
                    <Facebook className="mr-2 h-4 w-4 text-blue-600" />
                    Facebook
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
