// Initialize the Google Generative AI with your API key
const apiKey = process.env.GOOGLE_AI_API_KEY!

// Function to generate default interview questions
function generateDefaultQuestions(jobRole: string, industry: string | null, difficulty: string | null) {
  // Base questions that apply to most roles
  const baseQuestions = [
    {
      question_text: `Tell me about your experience as a ${jobRole}.`,
      question_type: "behavioral",
    },
    {
      question_text: `What are the key skills required for a ${jobRole} position?`,
      question_type: "general",
    },
    {
      question_text: `Describe a challenging situation you faced in your previous role.`,
      question_type: "behavioral",
    },
    {
      question_text: `How do you stay updated with the latest trends in ${industry || "your field"}?`,
      question_type: "general",
    },
    {
      question_text: `Where do you see yourself in 5 years?`,
      question_type: "general",
    },
  ]

  // Role-specific questions
  const roleSpecificQuestions: Record<string, any[]> = {
    "Software Engineer": [
      {
        question_text: "Explain the difference between a stack and a queue. When would you use each?",
        question_type: "technical",
      },
      {
        question_text: "How would you optimize a slow-loading web application?",
        question_type: "technical",
      },
      {
        question_text: "Describe a time when you had to refactor a large codebase. What approach did you take?",
        question_type: "behavioral",
      },
      {
        question_text: "How do you ensure your code is maintainable and readable for other developers?",
        question_type: "situational",
      },
    ],
    "Product Manager": [
      {
        question_text: "How do you prioritize features in your product roadmap?",
        question_type: "situational",
      },
      {
        question_text: "Describe a time when you had to make a difficult product decision based on user feedback.",
        question_type: "behavioral",
      },
      {
        question_text: "How do you measure the success of a product feature after launch?",
        question_type: "technical",
      },
      {
        question_text: "How do you balance stakeholder requests with user needs?",
        question_type: "situational",
      },
    ],
    "Data Scientist": [
      {
        question_text: "Explain the difference between supervised and unsupervised learning.",
        question_type: "technical",
      },
      {
        question_text: "How would you handle missing data in a dataset?",
        question_type: "technical",
      },
      {
        question_text: "Describe a time when your data analysis led to a significant business decision.",
        question_type: "behavioral",
      },
      {
        question_text: "How do you communicate complex data findings to non-technical stakeholders?",
        question_type: "situational",
      },
    ],
    "UX Designer": [
      {
        question_text: "Walk me through your design process from research to implementation.",
        question_type: "technical",
      },
      {
        question_text: "How do you incorporate user feedback into your designs?",
        question_type: "situational",
      },
      {
        question_text: "Describe a time when you had to defend a design decision to stakeholders.",
        question_type: "behavioral",
      },
      {
        question_text: "How do you balance aesthetic design with usability?",
        question_type: "situational",
      },
    ],
    "Marketing Manager": [
      {
        question_text: "How do you measure the success of a marketing campaign?",
        question_type: "technical",
      },
      {
        question_text: "Describe a marketing campaign you led that didn't meet expectations. What did you learn?",
        question_type: "behavioral",
      },
      {
        question_text: "How would you allocate a limited marketing budget across different channels?",
        question_type: "situational",
      },
      {
        question_text: "How do you stay ahead of changing marketing trends and technologies?",
        question_type: "general",
      },
    ],
    "Sales Representative": [
      {
        question_text: "How do you handle objections from potential customers?",
        question_type: "situational",
      },
      {
        question_text: "Describe your sales process from prospecting to closing.",
        question_type: "technical",
      },
      {
        question_text: "Tell me about a time when you lost a sale. What did you learn?",
        question_type: "behavioral",
      },
      {
        question_text: "How do you build long-term relationships with clients?",
        question_type: "situational",
      },
    ],
    "Project Manager": [
      {
        question_text: "How do you handle scope creep in a project?",
        question_type: "situational",
      },
      {
        question_text: "Describe a time when you had to manage a project with limited resources.",
        question_type: "behavioral",
      },
      {
        question_text: "What project management methodologies are you familiar with, and when do you use each?",
        question_type: "technical",
      },
      {
        question_text: "How do you communicate project status to stakeholders?",
        question_type: "situational",
      },
    ],
    "Customer Support Specialist": [
      {
        question_text: "How do you handle an angry or frustrated customer?",
        question_type: "situational",
      },
      {
        question_text: "Describe a time when you went above and beyond for a customer.",
        question_type: "behavioral",
      },
      {
        question_text: "How do you prioritize multiple customer issues?",
        question_type: "situational",
      },
      {
        question_text: "What metrics do you use to measure customer satisfaction?",
        question_type: "technical",
      },
    ],
  }

  // Get role-specific questions or use empty array if role not found
  const specificQuestions = roleSpecificQuestions[jobRole] || []

  // Combine base questions with role-specific questions
  let combinedQuestions = [...baseQuestions, ...specificQuestions]

  // Adjust difficulty if specified
  if (difficulty) {
    if (difficulty === "advanced") {
      combinedQuestions = combinedQuestions.map((q) => {
        if (q.question_type === "technical") {
          return {
            ...q,
            question_text: q.question_text.replace(/how|explain|describe/i, "Provide an in-depth explanation of"),
          }
        }
        return q
      })
    } else if (difficulty === "beginner") {
      combinedQuestions = combinedQuestions.map((q) => {
        if (q.question_type === "technical") {
          return {
            ...q,
            question_text: q.question_text.replace(/explain|describe/i, "Briefly explain"),
          }
        }
        return q
      })
    }
  }

  // Shuffle and return the questions
  return shuffleArray(combinedQuestions).slice(0, 7)
}

// Fisher-Yates shuffle algorithm
function shuffleArray(array: any[]) {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

// Function to generate default feedback
function generateDefaultFeedback() {
  return {
    feedback_text:
      "Your response addresses the question, but could be more specific and detailed. Consider providing concrete examples from your experience to support your points. Overall, your answer demonstrates a good understanding of the topic, but adding more depth would make it stronger.",
    strengths: ["Good communication", "Relevant points", "Clear structure"],
    improvement_areas: ["Add more specific examples", "Elaborate on key points", "Connect to the job role"],
    confidence_score: 0.7,
  }
}

// Generate interview questions based on job role and industry
export async function generateInterviewQuestions({
  jobRole,
  industry,
  difficulty,
  count = 5,
}: {
  jobRole: string
  industry: string | null
  difficulty: string | null
  count?: number
}) {
  try {
    // For now, we'll use default questions instead of the API
    // This ensures the application works even if the API is not available
    return generateDefaultQuestions(jobRole, industry, difficulty)
  } catch (error) {
    console.error("Error generating interview questions:", error)
    // Return default questions if there's an error
    return generateDefaultQuestions(jobRole, industry, difficulty)
  }
}

// Analyze a response to an interview question
export async function analyzeResponse({
  question,
  response,
  responseType,
  jobRole,
}: {
  question: string
  response: string
  responseType: "text" | "video" | "audio"
  jobRole: string
}) {
  try {
    // For now, we'll use default feedback instead of the API
    // This ensures the application works even if the API is not available
    return generateDefaultFeedback()
  } catch (error) {
    console.error("Error analyzing response:", error)
    // Return default feedback if there's an error
    return generateDefaultFeedback()
  }
}

// Transcribe audio or video to text
export async function transcribeMedia({
  mediaUrl,
  mediaType,
}: {
  mediaUrl: string
  mediaType: "audio" | "video"
}) {
  try {
    // For now, we'll return a simulated transcription
    return "I believe I'm well-suited for this position because of my experience and skills in this field. I've worked on similar projects in the past and have developed the necessary expertise to handle the challenges of this role effectively."
  } catch (error) {
    console.error(`Error transcribing ${mediaType}:`, error)
    return "I believe I'm well-suited for this position because of my experience and skills in this field. I've worked on similar projects in the past and have developed the necessary expertise to handle the challenges of this role effectively."
  }
}
