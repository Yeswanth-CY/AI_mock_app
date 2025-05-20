"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createInterviewWithQuestions } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { TemplateSelector } from "@/components/interview/template-selector"
import type { InterviewTemplate } from "@/lib/interview-templates"

export default function NewInterviewPage() {
  const [title, setTitle] = useState("")
  const [jobRole, setJobRole] = useState("")
  const [industry, setIndustry] = useState("")
  const [difficulty, setDifficulty] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("template") // Default to template tab

  const router = useRouter()
  const { toast } = useToast()

  const handleSelectTemplate = (template: InterviewTemplate) => {
    setTitle(template.title)
    setJobRole(template.jobRole)
    setIndustry(template.industry)
    setDifficulty(template.difficulty)
    // Automatically switch to the custom tab after selecting a template
    setActiveTab("custom")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("title", title)
      formData.append("jobRole", jobRole)
      formData.append("industry", industry)
      formData.append("difficulty", difficulty)

      toast({
        title: "Creating interview...",
        description: "Generating questions for your mock interview.",
      })

      const result = await createInterviewWithQuestions(formData)

      if (!result.success) {
        throw new Error(result.error || "Failed to create interview")
      }

      toast({
        title: "Interview created",
        description: "Your mock interview has been created successfully.",
      })

      router.push(`/interviews/${result.interviewId}`)
    } catch (err: any) {
      console.error("Error creating interview:", err)
      setError(err.message || "Failed to create interview")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create interview. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Create New Interview</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="template">Use Template</TabsTrigger>
          <TabsTrigger value="custom">Custom Interview</TabsTrigger>
        </TabsList>

        <TabsContent value="template">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Select an Interview Template</h2>
            <p className="text-muted-foreground">
              Choose from pre-defined templates for common job roles. You can customize the details after selecting a
              template.
            </p>
            <TemplateSelector onSelectTemplate={handleSelectTemplate} />
          </div>
        </TabsContent>

        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle>Interview Details</CardTitle>
              <CardDescription>
                Set up your mock interview by providing the details below. We'll generate relevant questions based on
                your job role and industry.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Interview Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Frontend Developer Interview Practice"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobRole">Job Role</Label>
                  <Input
                    id="jobRole"
                    placeholder="e.g., Frontend Developer"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    placeholder="e.g., Technology"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Interview...
                    </>
                  ) : (
                    "Create Interview"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
