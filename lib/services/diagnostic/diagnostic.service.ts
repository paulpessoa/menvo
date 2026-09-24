import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  DiagnosticSessionRow,
  DiagnosticState,
  DiagnosticSlotValues
} from "@/lib/ai-menvo/diagnostic/types"
import type { QuizAnalysisResult } from "@/lib/ai-menvo/diagnostic/analyze"

export class DiagnosticService {
  /**
   * Retrieves the active in-progress diagnostic session for a user, if any.
   * If an in-progress session has exceeded 7 days, it is marked as abandoned.
   */
  async getActiveSession(
    supabase: SupabaseClient,
    userId: string
  ): Promise<DiagnosticSessionRow | null> {
    const { data, error } = await supabase
      .from("diagnostic_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "in_progress")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) return null

    const session = data as unknown as DiagnosticSessionRow
    const expiresAt = new Date(session.expires_at)
    if (expiresAt < new Date()) {
      // Mark as abandoned without throwing
      await supabase
        .from("diagnostic_sessions")
        .update({ status: "abandoned", updated_at: new Date().toISOString() })
        .eq("id", session.id)
      return null
    }

    return session
  }

  /**
   * Retrieves the most recently completed session for the user.
   */
  async getLatestCompletedSession(
    supabase: SupabaseClient,
    userId: string
  ): Promise<DiagnosticSessionRow | null> {
    const { data, error } = await supabase
      .from("diagnostic_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) return null
    return data as unknown as DiagnosticSessionRow
  }

  /**
   * Creates a new in-progress diagnostic session.
   */
  async createSession(
    supabase: SupabaseClient,
    userId: string
  ): Promise<DiagnosticSessionRow> {
    const initialState: DiagnosticState = {
      currentStep: 1,
      answers: {},
      followups: {}
    }

    const { data, error } = await supabase
      .from("diagnostic_sessions")
      .insert({
        user_id: userId,
        status: "in_progress",
        current_step: 1,
        state: initialState as unknown as Record<string, unknown>
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data as unknown as DiagnosticSessionRow
  }

  /**
   * Updates intermediate state and current step in the database.
   */
  async updateSessionState(
    supabase: SupabaseClient,
    sessionId: string,
    state: DiagnosticState,
    currentStep: number
  ): Promise<void> {
    const { error } = await supabase
      .from("diagnostic_sessions")
      .update({
        state: state as unknown as Record<string, unknown>,
        current_step: currentStep,
        updated_at: new Date().toISOString()
      })
      .eq("id", sessionId)

    if (error) {
      console.error("[DiagnosticService] Error updating session state:", error)
      throw error
    }
  }

  /**
   * Saves final diagnostic results to quiz_responses and marks session as completed.
   */
  async completeDiagnostic(
    supabase: SupabaseClient,
    sessionId: string,
    userId: string,
    answers: DiagnosticSlotValues,
    analysis: QuizAnalysisResult
  ): Promise<{ quizResponseId: string }> {
    const quizResponseId = crypto.randomUUID()

    // 1. Get user name & email from profile / auth
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .maybeSingle()

    const name = profile?.full_name || "Mentorado"
    const email = (profile?.email || "").toLowerCase()

    // 2. Insert into quiz_responses
    const { error: insertError } = await supabase.from("quiz_responses").insert({
      id: quizResponseId,
      user_id: userId,
      diagnostic_session_id: sessionId,
      name,
      email,
      career_moment: answers.career_moment || "outro",
      current_challenge: answers.current_challenge || "",
      mentorship_experience: answers.mentorship_experience || "nao-sei",
      future_vision: answers.future_vision || "",
      development_areas: answers.development_areas || ["Planejamento de carreira"],
      personal_life_help: answers.personal_life_help || null,
      share_knowledge: answers.share_knowledge || "nao-pensou",
      ai_analysis: analysis as unknown as Record<string, unknown>,
      processed_at: new Date().toISOString()
    })

    if (insertError) {
      console.error("[DiagnosticService] Error saving quiz_response:", insertError)
      throw insertError
    }

    // 3. Mark session completed
    const { error: sessionError } = await supabase
      .from("diagnostic_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        quiz_response_id: quizResponseId,
        updated_at: new Date().toISOString()
      })
      .eq("id", sessionId)

    if (sessionError) {
      console.error("[DiagnosticService] Error marking session completed:", sessionError)
    }

    return { quizResponseId }
  }
}

export const diagnosticService = new DiagnosticService()
