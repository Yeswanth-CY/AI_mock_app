"use server"

import { createClient } from "@/lib/supabase/server"
import { generateInterviewQuestions, analyzeResponse, transcribeMedia } from "@/lib/gemini"
import { revalidatePath } from "next/cache"

// Generate interview questions and save them to the database
export async function generateAndSaveQuestions({
  interviewId,
  jobRole,
  industry,
  difficulty,
  count = 5,
}: {
  interviewId: string
  jobRole: string
  industry: string | null
  difficulty: string | null
  count?: number
}) {
  try {
    const supabase = createClient()

    // Generate questions using our utility function
    // This will now return default questions if the API is not available
    const questions = await generateInterviewQuestions({
      jobRole,
      industry,
      difficulty,
      count,
    })

    // Insert questions into the database
    const questionsToInsert = questions.map((question: any, index: number) => ({
      interview_id: interviewId,
      question_text: question.question_text,
      question_type: question.question_type,
      order_number: index + 1,
    }))

    const { error } = await supabase.from("questions").insert(questionsToInsert)

    if (error) {
      throw error
    }

    return { success: true, questions }
  } catch (error) {
    console.error("Error generating and saving questions:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Analyze a response and save feedback to the database
export async function analyzeAndSaveFeedback({
  responseId,
  questionText,
  responseText,
  responseType,
  jobRole,
  mediaUrl,
}: {
  responseId: string
  questionText: string
  responseText: string | null
  responseType: "text" | "video" | "audio"
  jobRole: string
  mediaUrl: string | null
}) {
  try {
    const supabase = createClient()

    let textToAnalyze = responseText

    // If it's a video or audio response, transcribe it first
    if ((responseType === "video" || responseType === "audio") && mediaUrl && !responseText) {
      textToAnalyze = await transcribeMedia({
        mediaUrl,
        mediaType: responseType === "video" ? "video" : "audio",
      })

      // Update the response with the transcribed text
      await supabase.from("responses").update({ response_text: textToAnalyze }).eq("id", responseId)
    }

    if (!textToAnalyze) {
      throw new Error("No text to analyze")
    }

    // Analyze the response using our utility function
    // This will now return default feedback if the API is not available
    const analysis = await analyzeResponse({
      question: questionText,
      response: textToAnalyze,
      responseType,
      jobRole,
    })

    // Check if feedback already exists for this response
    const { data: existingFeedback } = await supabase
      .from("feedback")
      .select("id")
      .eq("response_id", responseId)
      .single()

    if (existingFeedback) {
      // Update existing feedback
      const { error } = await supabase
        .from("feedback")
        .update({
          feedback_text: analysis.feedback_text,
          improvement_areas: analysis.improvement_areas,
          strengths: analysis.strengths,
          confidence_score: analysis.confidence_score,
        })
        .eq("id", existingFeedback.id)

      if (error) throw error
    } else {
      // Insert new feedback
      const { error } = await supabase.from("feedback").insert({
        response_id: responseId,
        feedback_text: analysis.feedback_text,
        improvement_areas: analysis.improvement_areas,
        strengths: analysis.strengths,
        confidence_score: analysis.confidence_score,
      })

      if (error) throw error
    }

    return { success: true, analysis }
  } catch (error) {
    console.error("Error analyzing and saving feedback:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Create a new interview with generated questions
export async function createInterviewWithQuestions(formData: FormData) {
  try {
    const supabase = createClient()

    const title = formData.get("title") as string
    const jobRole = formData.get("jobRole") as string
    const industry = formData.get("industry") as string
    const difficulty = formData.get("difficulty") as string

    // Insert the interview without a user_id since we've made it nullable
    const { data: interview, error: insertError } = await supabase
      .from("interviews")
      .insert({
        // No user_id field - it's now nullable
        title,
        job_role: jobRole,
        industry: industry || null,
        difficulty: difficulty || null,
        status: "in_progress",
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Generate and save questions
    const result = await generateAndSaveQuestions({
      interviewId: interview.id,
      jobRole,
      industry: industry || null,
      difficulty: difficulty || null,
    })

    if (!result.success) {
      throw new Error(result.error || "Failed to generate questions")
    }

    revalidatePath("/dashboard")
    return { success: true, interviewId: interview.id }
  } catch (error) {
    console.error("Error creating interview:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Save a response and generate feedback
export async function saveResponseWithFeedback({
  questionId,
  responseType,
  responseText,
  mediaUrl,
  questionText,
  jobRole,
}: {
  questionId: string
  responseType: "text" | "video" | "audio"
  responseText: string | null
  mediaUrl: string | null
  questionText: string
  jobRole: string
}) {
  try {
    const supabase = createClient()

    // Check if a response already exists for this question
    const { data: existingResponse } = await supabase
      .from("responses")
      .select("id")
      .eq("question_id", questionId)
      .single()

    let responseId: string

    if (existingResponse) {
      // Update existing response
      await supabase
        .from("responses")
        .update({
          response_type: responseType,
          response_text: responseText,
          media_url: mediaUrl,
        })
        .eq("id", existingResponse.id)

      responseId = existingResponse.id
    } else {
      // Insert new response
      const { data: newResponse, error } = await supabase
        .from("responses")
        .insert({
          question_id: questionId,
          response_type: responseType,
          response_text: responseText,
          media_url: mediaUrl,
        })
        .select()
        .single()

      if (error) throw error
      responseId = newResponse.id
    }

    // Generate and save feedback
    const result = await analyzeAndSaveFeedback({
      responseId,
      questionText,
      responseText,
      responseType,
      jobRole,
      mediaUrl,
    })

    if (!result.success) {
      throw new Error(result.error || "Failed to analyze response")
    }

    return { success: true, responseId, feedback: result.analysis }
  } catch (error) {
    console.error("Error saving response with feedback:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Complete an interview
export async function completeInterview(interviewId: string) {
  try {
    const supabase = createClient()

    await supabase
      .from("interviews")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", interviewId)

    revalidatePath(`/interviews/${interviewId}`)
    revalidatePath(`/interviews/${interviewId}/results`)
    revalidatePath("/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Error completing interview:", error)
    return { success: false, error: (error as Error).message }
  }
}
