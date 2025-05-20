"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/types/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, ArrowRight, CheckCircle, Mic, Video, Type, Loader2 } from "lucide-react"
import { WebcamRecorder } from "./webcam-recorder"
import { AudioRecorder } from "./audio-recorder"
import { saveResponseWithFeedback, completeInterview } from "@/app/actions"

type Interview = Database["public"]["Tables"]["interviews"]["Row"]
type Question = Database["public"]["Tables"]["questions"]["Row"]

interface InterviewSessionProps {
  interview: Interview
  questions: Question[]
}

export function InterviewSession({ interview, questions }: InterviewSessionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responseType, setResponseType] = useState<"text" | "video" | "audio">("text")
  const [textResponse, setTextResponse] = useState("")
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(interview.status === "completed")
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  // Reset media state when changing questions or response type
  useEffect(() => {
    resetResponseState()
  }, [currentQuestionIndex, responseType])

  const handleNextQuestion = async () => {
    if (!currentQuestion) return

    setIsSubmitting(true)

    try {
      // Save the current response
      await saveResponse()

      // Move to the next question or complete the interview
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        resetResponseState()
      } else {
        // Complete the interview
        await completeInterviewSession()
        setIsCompleted(true)
      }
    } catch (error) {
      console.error("Error saving response:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your response. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      resetResponseState()
    }
  }

  const resetResponseState = () => {
    setTextResponse("")
    setVideoBlob(null)
    setAudioBlob(null)
  }

  const saveResponse = async () => {
    if (!currentQuestion) return

    setFeedbackLoading(true)
    let responseText = null
    let mediaUrl = null

    // Process response based on type
    if (responseType === "text") {
      responseText = textResponse
    } else if (responseType === "video" && videoBlob) {
      // Upload video to Supabase Storage
      const fileName = `interviews/${interview.id}/question_${currentQuestion.id}_video.webm`
      const { data, error } = await supabase.storage.from("responses").upload(fileName, videoBlob, {
        contentType: "video/webm",
        upsert: true,
      })

      if (error) throw error

      // Get public URL
      const { data: publicUrlData } = supabase.storage.from("responses").getPublicUrl(fileName)

      mediaUrl = publicUrlData.publicUrl
    } else if (responseType === "audio" && audioBlob) {
      // Upload audio to Supabase Storage
      const fileName = `interviews/${interview.id}/question_${currentQuestion.id}_audio.webm`
      const { data, error } = await supabase.storage.from("responses").upload(fileName, audioBlob, {
        contentType: "audio/webm",
        upsert: true,
      })

      if (error) throw error

      // Get public URL
      const { data: publicUrlData } = supabase.storage.from("responses").getPublicUrl(fileName)

      mediaUrl = publicUrlData.publicUrl
    }

    try {
      // Save response and generate feedback using Gemini API
      const result = await saveResponseWithFeedback({
        questionId: currentQuestion.id,
        responseType,
        responseText,
        mediaUrl,
        questionText: currentQuestion.question_text,
        jobRole: interview.job_role,
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to save response")
      }

      toast({
        title: "Response saved",
        description: "Your response has been saved and analyzed.",
      })
    } catch (error) {
      console.error("Error saving response with feedback:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to analyze your response. Your answer was saved, but feedback may be incomplete.",
      })
    } finally {
      setFeedbackLoading(false)
    }
  }

  const completeInterviewSession = async () => {
    const result = await completeInterview(interview.id)

    if (!result.success) {
      throw new Error(result.error || "Failed to complete interview")
    }

    toast({
      title: "Interview completed",
      description: "Your mock interview has been completed successfully.",
    })

    // Redirect to results page
    router.push(`/interviews/${interview.id}/results`)
  }

  const getQuestionTypeBadge = (type: string | null) => {
    if (!type) return null

    switch (type) {
      case "behavioral":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            Behavioral
          </Badge>
        )
      case "technical":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
            Technical
          </Badge>
        )
      case "situational":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            Situational
          </Badge>
        )
      case "general":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            General
          </Badge>
        )
      default:
        return null
    }
  }

  if (isCompleted) {
    return (
      <Card className="text-center p-8">
        <div className="flex flex-col items-center justify-center">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Interview Completed</h2>
          <p className="text-muted-foreground mb-6">You have successfully completed this mock interview.</p>
          <Button asChild>
            <a href={`/interviews/${interview.id}/results`}>View Results</a>
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">{interview.title}</h1>
        <p className="text-muted-foreground">
          {interview.job_role} {interview.industry && `• ${interview.industry}`}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>
        <Progress value={progress} className="w-1/3" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">Question {currentQuestionIndex + 1}</CardTitle>
              <CardDescription>{getQuestionTypeBadge(currentQuestion?.question_type)}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-lg mb-6">{currentQuestion?.question_text}</p>

          <Tabs value={responseType} onValueChange={(value) => setResponseType(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="text">
                <Type className="h-4 w-4 mr-2" />
                Text
              </TabsTrigger>
              <TabsTrigger value="video">
                <Video className="h-4 w-4 mr-2" />
                Video
              </TabsTrigger>
              <TabsTrigger value="audio">
                <Mic className="h-4 w-4 mr-2" />
                Audio
              </TabsTrigger>
            </TabsList>
            <TabsContent value="text" className="mt-4">
              <Textarea
                placeholder="Type your answer here..."
                className="min-h-[200px]"
                value={textResponse}
                onChange={(e) => setTextResponse(e.target.value)}
              />
            </TabsContent>
            <TabsContent value="video" className="mt-4">
              <WebcamRecorder onRecordingComplete={setVideoBlob} />
            </TabsContent>
            <TabsContent value="audio" className="mt-4">
              <AudioRecorder onRecordingComplete={setAudioBlob} />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0 || isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <Button
            onClick={handleNextQuestion}
            disabled={
              isSubmitting ||
              (responseType === "text" && !textResponse) ||
              (responseType === "video" && !videoBlob) ||
              (responseType === "audio" && !audioBlob)
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {feedbackLoading ? "Analyzing..." : "Saving..."}
              </>
            ) : currentQuestionIndex === questions.length - 1 ? (
              <>
                Complete
                <CheckCircle className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
