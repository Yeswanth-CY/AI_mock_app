"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Database } from "@/types/supabase"
import { ArrowLeft, Download, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

type Interview = Database["public"]["Tables"]["interviews"]["Row"]
type Question = Database["public"]["Tables"]["questions"]["Row"] & {
  responses: Array<{
    id: string
    question_id: string
    response_type: "text" | "video" | "audio"
    response_text: string | null
    media_url: string | null
    created_at: string
    feedback: Array<{
      id: string
      response_id: string
      feedback_text: string
      improvement_areas: string[] | null
      strengths: string[] | null
      confidence_score: number | null
      created_at: string
    }>
  }>
}

interface InterviewResultsProps {
  interview: Interview
  questions: Question[]
}

export function InterviewResults({ interview, questions }: InterviewResultsProps) {
  const [activeTab, setActiveTab] = useState("summary")
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([])
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({})

  // Clean up media elements when component unmounts or when accordion items change
  useEffect(() => {
    return () => {
      // Pause all videos and audios when component unmounts
      Object.values(videoRefs.current).forEach((videoEl) => {
        if (videoEl && !videoEl.paused) {
          videoEl.pause()
        }
      })

      Object.values(audioRefs.current).forEach((audioEl) => {
        if (audioEl && !audioEl.paused) {
          audioEl.pause()
        }
      })
    }
  }, [])

  // Handle accordion state changes
  useEffect(() => {
    // Pause media in closed accordion items
    Object.entries(videoRefs.current).forEach(([id, videoEl]) => {
      if (videoEl && !openAccordionItems.includes(id) && !videoEl.paused) {
        videoEl.pause()
      }
    })

    Object.entries(audioRefs.current).forEach(([id, audioEl]) => {
      if (audioEl && !openAccordionItems.includes(id) && !audioEl.paused) {
        audioEl.pause()
      }
    })
  }, [openAccordionItems])

  const handleAccordionChange = (value: string) => {
    if (openAccordionItems.includes(value)) {
      setOpenAccordionItems(openAccordionItems.filter((item) => item !== value))
    } else {
      setOpenAccordionItems([...openAccordionItems, value])
    }
  }

  const getOverallScore = () => {
    let totalScore = 0
    let totalResponses = 0

    questions.forEach((question) => {
      question.responses.forEach((response) => {
        response.feedback.forEach((feedback) => {
          if (feedback.confidence_score) {
            totalScore += feedback.confidence_score
            totalResponses++
          }
        })
      })
    })

    return totalResponses > 0 ? (totalScore / totalResponses) * 100 : 0
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-6 w-6 text-green-500" />
    if (score >= 60) return <AlertCircle className="h-6 w-6 text-yellow-500" />
    return <XCircle className="h-6 w-6 text-red-500" />
  }

  const getAllStrengths = () => {
    const strengths = new Set<string>()

    questions.forEach((question) => {
      question.responses.forEach((response) => {
        response.feedback.forEach((feedback) => {
          if (feedback.strengths) {
            feedback.strengths.forEach((strength) => strengths.add(strength))
          }
        })
      })
    })

    return Array.from(strengths)
  }

  const getAllImprovementAreas = () => {
    const areas = new Set<string>()

    questions.forEach((question) => {
      question.responses.forEach((response) => {
        response.feedback.forEach((feedback) => {
          if (feedback.improvement_areas) {
            feedback.improvement_areas.forEach((area) => areas.add(area))
          }
        })
      })
    })

    return Array.from(areas)
  }

  const overallScore = getOverallScore()
  const strengths = getAllStrengths()
  const improvementAreas = getAllImprovementAreas()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" asChild className="mb-2">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{interview.title} Results</h1>
          <p className="text-muted-foreground">
            {interview.job_role} {interview.industry && `• ${interview.industry}`}
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Results
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Overall Performance</CardTitle>
              <CardDescription>Your overall interview performance score and key insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6">
                <div className="flex items-center mb-4">
                  {getScoreIcon(overallScore)}
                  <span className={`text-4xl font-bold ml-2 ${getScoreColor(overallScore)}`}>
                    {Math.round(overallScore)}%
                  </span>
                </div>
                <p className="text-center text-muted-foreground max-w-md">
                  {overallScore >= 80
                    ? "Excellent performance! You demonstrated strong interview skills across most questions."
                    : overallScore >= 60
                      ? "Good performance with some areas for improvement. Review the detailed feedback for specific suggestions."
                      : "There are several areas where you can improve. Review the detailed feedback and practice more."}
                </p>
              </div>

              <div className="grid gap-6 mt-6 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Key Strengths</h3>
                  <ul className="space-y-2">
                    {strengths.map((strength, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Areas for Improvement</h3>
                  <ul className="space-y-2">
                    {improvementAreas.map((area, index) => (
                      <li key={index} className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 shrink-0 mt-0.5" />
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6 pt-4">
          <Accordion
            type="multiple"
            value={openAccordionItems}
            onValueChange={setOpenAccordionItems}
            className="w-full"
          >
            {questions.map((question, index) => {
              const response = question.responses[0]
              const feedback = response?.feedback[0]

              return (
                <AccordionItem key={question.id} value={question.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center text-left">
                      <span className="font-medium">
                        Question {index + 1}: {question.question_text.substring(0, 60)}
                        {question.question_text.length > 60 ? "..." : ""}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <div>
                        <h4 className="font-medium mb-2">Question:</h4>
                        <p>{question.question_text}</p>
                        <div className="mt-2">
                          <Badge variant="outline">
                            {question.question_type?.charAt(0).toUpperCase() + question.question_type?.slice(1) ||
                              "General"}
                          </Badge>
                        </div>
                      </div>

                      {response && (
                        <div>
                          <h4 className="font-medium mb-2">Your Response:</h4>
                          {response.response_type === "text" && response.response_text && (
                            <p className="bg-muted p-3 rounded">{response.response_text}</p>
                          )}

                          {response.response_type === "video" && response.media_url && (
                            <video
                              src={response.media_url}
                              controls
                              className="w-full rounded"
                              ref={(el) => {
                                videoRefs.current[question.id] = el
                              }}
                              onPlay={() => {
                                // Pause all other videos when this one plays
                                Object.entries(videoRefs.current).forEach(([id, videoEl]) => {
                                  if (id !== question.id && videoEl && !videoEl.paused) {
                                    videoEl.pause()
                                  }
                                })
                              }}
                            />
                          )}

                          {response.response_type === "audio" && response.media_url && (
                            <audio
                              src={response.media_url}
                              controls
                              className="w-full"
                              ref={(el) => {
                                audioRefs.current[question.id] = el
                              }}
                              onPlay={() => {
                                // Pause all other audios when this one plays
                                Object.entries(audioRefs.current).forEach(([id, audioEl]) => {
                                  if (id !== question.id && audioEl && !audioEl.paused) {
                                    audioEl.pause()
                                  }
                                })
                              }}
                            />
                          )}

                          <div className="mt-2">
                            <Badge>
                              {response.response_type.charAt(0).toUpperCase() + response.response_type.slice(1)}{" "}
                              Response
                            </Badge>
                          </div>
                        </div>
                      )}

                      {feedback && (
                        <div>
                          <h4 className="font-medium mb-2">Feedback:</h4>
                          <p className="bg-primary/5 p-3 rounded">{feedback.feedback_text}</p>

                          <div className="grid gap-4 mt-4 md:grid-cols-2">
                            {feedback.strengths && feedback.strengths.length > 0 && (
                              <div>
                                <h5 className="font-medium mb-2 text-sm">Strengths:</h5>
                                <ul className="space-y-1">
                                  {feedback.strengths.map((strength, i) => (
                                    <li key={i} className="flex items-start text-sm">
                                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 shrink-0 mt-0.5" />
                                      <span>{strength}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {feedback.improvement_areas && feedback.improvement_areas.length > 0 && (
                              <div>
                                <h5 className="font-medium mb-2 text-sm">Areas for Improvement:</h5>
                                <ul className="space-y-1">
                                  {feedback.improvement_areas.map((area, i) => (
                                    <li key={i} className="flex items-start text-sm">
                                      <AlertCircle className="h-4 w-4 text-yellow-500 mr-2 shrink-0 mt-0.5" />
                                      <span>{area}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </TabsContent>
      </Tabs>
    </div>
  )
}
