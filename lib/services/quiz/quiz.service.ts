import { createClient } from "@/lib/utils/supabase/client"
import type {
  QuizResponseRow,
  QuizResponseInsert,
  QuizResponseSummary,
  QuizAnalysisResult
} from "@/lib/types/models/quiz"

/**
 * Service to manage quiz responses, AI analysis trigger, and user diagnostic queries.
 */
class QuizService {
  private supabase = createClient()

  /**
   * Retrieves the most recent quiz response for a given email address.
   * Useful for determining if a logged-in mentee has already completed the assessment.
   *
   * @param email - User's email address
   * @returns QuizResponseSummary or null if none found
   */
  async getLatestQuizResponseByEmail(email: string): Promise<QuizResponseSummary | null> {
    if (!email) return null

    try {
      const normalizedEmail = email.trim().toLowerCase()

      const { data, error } = await this.supabase
        .from("quiz_responses")
        .select("id, name, email, score, processed_at, created_at, development_areas, career_moment, ai_analysis")
        .eq("email", normalizedEmail)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error("[QuizService] Error fetching quiz response by email:", error)
        return null
      }

      if (!data) return null

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        score: data.score,
        processed_at: data.processed_at,
        created_at: data.created_at,
        development_areas: data.development_areas || [],
        career_moment: data.career_moment,
        ai_analysis: (data.ai_analysis as unknown as QuizAnalysisResult) || null
      }
    } catch (err) {
      console.error("[QuizService] Unexpected error fetching quiz by email:", err)
      return null
    }
  }

  /**
   * Retrieves a full quiz response record by its unique ID.
   *
   * @param id - UUID of the quiz response
   * @returns QuizResponseRow or null if not found
   */
  async getQuizResponseById(id: string): Promise<QuizResponseRow | null> {
    if (!id) return null

    try {
      const { data, error } = await this.supabase
        .from("quiz_responses")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        console.error("[QuizService] Error loading quiz results by ID:", error)
        return null
      }

      return data
    } catch (err) {
      console.error("[QuizService] Unexpected error loading quiz results:", err)
      return null
    }
  }

  /**
   * Submits a new quiz response and triggers the background AI analysis.
   *
   * @param payload - Quiz response data matching table insert schema
   * @returns Created QuizResponseRow
   */
  async submitQuiz(payload: QuizResponseInsert): Promise<QuizResponseRow> {
    const { data: response, error } = await this.supabase
      .from("quiz_responses")
      .insert({
        ...payload,
        email: payload.email.trim().toLowerCase()
      })
      .select()
      .single()

    if (error || !response) {
      throw error || new Error("Failed to create quiz response")
    }

    // Trigger AI analysis Edge Function asynchronously
    try {
      await this.supabase.functions.invoke("analyze-quiz", {
        body: { responseId: response.id }
      })
    } catch (analysisError) {
      console.warn("[QuizService] Asynchronous AI trigger warning:", analysisError)
    }

    return response
  }

  /**
   * Invokes the Edge Function to send an email with the quiz analysis results.
   *
   * @param responseId - UUID of the quiz response
   */
  async sendResultsEmail(responseId: string): Promise<void> {
    const { error } = await this.supabase.functions.invoke("send-quiz-email", {
      body: { responseId }
    })

    if (error) {
      throw error
    }
  }
}

export const quizService = new QuizService()
