import { createClient } from "@/lib/utils/supabase/client"
import type {
  QuizResponseInsert,
  QuizResponseSummary,
  QuizResultView,
  QuizAnalysisResult
} from "@/lib/types/models/quiz"

/**
 * Service to manage quiz responses, AI analysis trigger, and user diagnostic queries.
 *
 * `quiz_responses` RLS (migration `20260923000005_quiz_responses_privacy.sql`,
 * audit in STATUS.md 2026-09-23) no longer allows an anonymous or
 * cross-account read of the table: a logged-in user reads only rows
 * matching their own e-mail, and there is no `anon` SELECT at all. The
 * anonymous quiz still needs to read back its own just-submitted row by
 * `id` (the results page, shared on LinkedIn/WhatsApp by design) — that
 * goes through `get_quiz_result`, a `security definer` RPC that returns
 * only `id`, `processed_at` and `ai_analysis`, never name/e-mail/answers.
 */
class QuizService {
  private supabase = createClient()

  /**
   * Retrieves the most recent quiz response for a given email address.
   * Useful for determining if a logged-in mentee has already completed the assessment.
   *
   * Only works for the caller's own e-mail — RLS enforces this even though
   * the query itself doesn't filter by session, since the caller is
   * expected to pass their own logged-in e-mail (dashboard/mentee/page.tsx).
   *
   * @param email - User's email address
   * @returns QuizResponseSummary or null if none found
   */
  async getLatestQuizResponseByEmail(email: string): Promise<QuizResponseSummary | null> {
    if (!email) return null

    try {
      const normalizedEmail = email.trim().toLowerCase()

      const { data, error } = await (this.supabase
        .from("quiz_responses") as any)
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
   * Retrieves the public result view for a quiz response by its UUID — the
   * only three fields `/quiz/results/[id]` renders. Works for anonymous
   * visitors (the results link is shared) through the `get_quiz_result` RPC,
   * never a direct `.select()` on `quiz_responses`.
   *
   * @param id - UUID of the quiz response
   * @returns QuizResultView or null if not found
   */
  async getQuizResponseById(id: string): Promise<QuizResultView | null> {
    if (!id) return null

    try {
      const { data, error } = await (this.supabase.rpc as any)("get_quiz_result", { p_id: id })

      if (error) {
        console.error("[QuizService] Error loading quiz results by ID:", error)
        return null
      }

      const row = Array.isArray(data) ? data[0] : data
      if (!row) return null

      return {
        id: row.id,
        processed_at: row.processed_at,
        ai_analysis: (row.ai_analysis as unknown as QuizAnalysisResult) || null
      }
    } catch (err) {
      console.error("[QuizService] Unexpected error loading quiz results:", err)
      return null
    }
  }

  /**
   * Submits a new quiz response and triggers the background AI analysis.
   *
   * The id is generated on the client because the insert can no longer be
   * followed by a `.select()`: PostgREST does a SELECT to return the
   * inserted row, and an anonymous submitter has no SELECT policy on
   * `quiz_responses` any more (only their own row, once logged in, does).
   *
   * @param payload - Quiz response data matching table insert schema
   * @returns The generated id, to route to `/quiz/results/[id]`
   */
  async submitQuiz(payload: QuizResponseInsert): Promise<{ id: string }> {
    const id = crypto.randomUUID()

    const { error } = await (this.supabase.from("quiz_responses") as any).insert({
      ...payload,
      id,
      email: payload.email.trim().toLowerCase()
    })

    if (error) {
      throw error
    }

    await this.requestAnalysis(id)

    return { id }
  }

  /**
   * Asks the server to analyze a quiz response (POST /api/quiz/[id]/analyze
   * — model registry, metered, inside the AI budget; ADR 0004 §7.3, replaces
   * the old analyze-quiz Edge Function). Safe to call more than once: the
   * server claims the row atomically, so a duplicate request does nothing.
   * Never throws — the results page polls for the outcome either way.
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
