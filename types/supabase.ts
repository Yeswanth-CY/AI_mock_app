export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      interviews: {
        Row: {
          id: string
          user_id: string | null
          title: string
          job_role: string
          industry: string | null
          difficulty: "beginner" | "intermediate" | "advanced" | null
          created_at: string
          completed_at: string | null
          status: "in_progress" | "completed" | "abandoned"
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          job_role: string
          industry?: string | null
          difficulty?: "beginner" | "intermediate" | "advanced" | null
          created_at?: string
          completed_at?: string | null
          status?: "in_progress" | "completed" | "abandoned"
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          job_role?: string
          industry?: string | null
          difficulty?: "beginner" | "intermediate" | "advanced" | null
          created_at?: string
          completed_at?: string | null
          status?: "in_progress" | "completed" | "abandoned"
        }
      }
      questions: {
        Row: {
          id: string
          interview_id: string
          question_text: string
          question_type: "behavioral" | "technical" | "situational" | "general" | null
          order_number: number
          created_at: string
        }
        Insert: {
          id?: string
          interview_id: string
          question_text: string
          question_type?: "behavioral" | "technical" | "situational" | "general" | null
          order_number: number
          created_at?: string
        }
        Update: {
          id?: string
          interview_id?: string
          question_text?: string
          question_type?: "behavioral" | "technical" | "situational" | "general" | null
          order_number?: number
          created_at?: string
        }
      }
      responses: {
        Row: {
          id: string
          question_id: string
          response_type: "text" | "video" | "audio"
          response_text: string | null
          media_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          response_type: "text" | "video" | "audio"
          response_text?: string | null
          media_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          response_type?: "text" | "video" | "audio"
          response_text?: string | null
          media_url?: string | null
          created_at?: string
        }
      }
      feedback: {
        Row: {
          id: string
          response_id: string
          feedback_text: string
          improvement_areas: string[] | null
          strengths: string[] | null
          confidence_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          response_id: string
          feedback_text: string
          improvement_areas?: string[] | null
          strengths?: string[] | null
          confidence_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          response_id?: string
          feedback_text?: string
          improvement_areas?: string[] | null
          strengths?: string[] | null
          confidence_score?: number | null
          created_at?: string
        }
      }
    }
  }
}
