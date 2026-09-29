import type {
  QuizResponseSummary,
  QuizResultView,
  QuizAnalysisResult
} from "@/lib/types/models/quiz"

export interface QuizSubmitInput {
  name: string
  email: string
  linkedin_url?: string | null
  career_moment: string
  mentorship_experience: string
  development_areas: string[]
  current_challenge: string
  future_vision: string
  share_knowledge: string
  personal_life_help: string
}

/**
 * Client-side wrapper around the quiz API routes (`app/api/quiz/**`). Kept
 * as a thin fetch layer, rather than talking to Supabase directly from the
 * browser, so every read/write on `quiz_responses` goes through one place
 * that validates input and can be rate-limited (docs/COMMUNITY_CONTACT_PLAN.md §13).
 */
class QuizService {
  /**
   * Retrieves the caller's own most recent quiz response, used by
   * `/dashboard/mentee` to check whether the diagnostic was already done.
   * The server derives the e-mail from the session - the parameter here is
   * unused, kept only so existing callers don't need to change.
   */
  async getLatestQuizResponseByEmail(_email: string): Promise<QuizResponseSummary | null> {
    try {
      const res = await fetch("/api/quiz/latest")
      if (!res.ok) return null
      const { summary } = await res.json()
      return summary ?? null
    } catch (err) {
      console.error("[QuizService] Unexpected error fetching quiz by email:", err)
      return null
    }
  }

  /**
   * Retrieves the public result view for a quiz response by its UUID - the
   * only three fields `/quiz/results/[id]` renders. Works for anonymous
   * visitors (the results link is shared).
   */
  async getQuizResponseById(id: string): Promise<QuizResultView | null> {
    if (!id) return null

    try {
      const res = await fetch(`/api/quiz/${id}`)
      if (!res.ok) return null
      return await res.json()
    } catch (err) {
      console.error("[QuizService] Unexpected error loading quiz results:", err)
      return null
    }
  }

  /**
   * Submits a new quiz response and triggers the background AI analysis.
   *
   * @param payload - Quiz response data
   * @returns The generated id, to route to `/quiz/results/[id]`
   */
  async submitQuiz(payload: QuizSubmitInput): Promise<{ id: string }> {
    const res = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data?.error || "Não foi possível enviar o questionário")
    }

    return data as { id: string }
  }

  /**
   * Asks the server to analyze a quiz response (POST /api/quiz/[id]/analyze
   * - model registry, metered, inside the AI budget). Safe to call more than
   * once: the server claims the row atomically, so a duplicate request does
   * nothing. Never throws - the results page polls for the outcome either way.
   *
   * @param id - UUID of the quiz response
   */
  async requestAnalysis(id: string): Promise<void> {
    try {
      await fetch(`/api/quiz/${id}/analyze`, { method: "POST" })
    } catch (analysisError) {
      console.warn("[QuizService] Asynchronous AI trigger warning:", analysisError)
    }
  }

  /**
   * Re-sends the quiz analysis results by e-mail.
   *
   * @param responseId - UUID of the quiz response
   */
  async sendResultsEmail(responseId: string): Promise<void> {
    const res = await fetch(`/api/quiz/${responseId}/send-email`, { method: "POST" })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data?.error || "Não foi possível enviar o e-mail")
    }
  }
}

export const quizService = new QuizService()
