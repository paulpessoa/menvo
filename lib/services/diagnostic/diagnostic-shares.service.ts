import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  CreateDiagnosticShareInput,
  DiagnosticShareRecord,
  DiagnosticShareWithMentor,
  DiagnosticShareWithMentee,
  SharedDiagnosticInsight
} from "@/lib/types/models/diagnostic-shares"
import type { QuizAnalysisResult } from "@/lib/types/models/quiz"

/**
 * Service to manage secure sharing of diagnostic sessions and quiz responses
 * between mentees and mentors, enforcing strict consent and role-based privacy.
 *
 * Implements AI_PLATFORM_PLAN.md §8 (item 5b) & §12.2:
 * - Mentee can share and revoke diagnostic access at any time.
 * - Mentor can only read active shares (where revoked_at is NULL).
 * - When scope is 'summary' (default), personal life responses are omitted.
 */
export class DiagnosticSharesService {
  /**
   * Shares a diagnostic session or quiz response with a designated mentor.
   * If an existing revoked share exists, it reactivates it with the new scope.
   *
   * @param supabase - Authenticated Supabase client (respects RLS)
   * @param menteeId - ID of the mentee initiating the share (must match auth.uid())
   * @param input - Validated input containing mentor_id, target IDs, and scope
   * @returns The created or updated DiagnosticShareRecord
   */
  async shareDiagnostic(
    supabase: SupabaseClient,
    menteeId: string,
    input: CreateDiagnosticShareInput
  ): Promise<DiagnosticShareRecord> {
    const scope = input.scope || "summary"

    // 1. Check if there's already an active or revoked share for this target and mentor
    let query = supabase
      .from("diagnostic_shares")
      .select("id, revoked_at")
      .eq("mentee_id", menteeId)
      .eq("mentor_id", input.mentor_id)

    if (input.quiz_response_id) {
      query = query.eq("quiz_response_id", input.quiz_response_id)
    } else if (input.diagnostic_session_id) {
      query = query.eq("diagnostic_session_id", input.diagnostic_session_id)
    }

    const { data: existingShares, error: searchError } = await query

    if (searchError) {
      console.error("[DiagnosticSharesService] Error querying existing shares:", searchError)
      throw searchError
    }

    const existing = existingShares && existingShares.length > 0 ? existingShares[0] : null

    if (existing) {
      // If already active with same scope, return as is
      if (!existing.revoked_at) {
        const { data: updated, error: updateError } = await supabase
          .from("diagnostic_shares")
          .update({ scope })
          .eq("id", existing.id)
          .select()
          .single()

        if (updateError) throw updateError
        return updated as DiagnosticShareRecord
      }

      // Reactivate revoked share
      const { data: reactivated, error: reactivateError } = await supabase
        .from("diagnostic_shares")
        .update({
          revoked_at: null,
          scope,
          created_at: new Date().toISOString()
        })
        .eq("id", existing.id)
        .select()
        .single()

      if (reactivateError) {
        console.error("[DiagnosticSharesService] Error reactivating share:", reactivateError)
        throw reactivateError
      }

      return reactivated as DiagnosticShareRecord
    }

    // 2. Insert new share
    const { data, error } = await supabase
      .from("diagnostic_shares")
      .insert({
        mentee_id: menteeId,
        mentor_id: input.mentor_id,
        quiz_response_id: input.quiz_response_id || null,
        diagnostic_session_id: input.diagnostic_session_id || null,
        scope
      })
      .select()
      .single()

    if (error) {
      console.error("[DiagnosticSharesService] Error creating share:", error)
      throw error
    }

    return data as DiagnosticShareRecord
  }

  /**
   * Revokes an existing diagnostic share.
   *
   * @param supabase - Authenticated Supabase client
   * @param shareId - UUID of the diagnostic share
   * @param menteeId - ID of the mentee (enforces ownership)
   */
  async revokeShare(
    supabase: SupabaseClient,
    shareId: string,
    menteeId: string
  ): Promise<void> {
    const { error } = await supabase
      .from("diagnostic_shares")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", shareId)
      .eq("mentee_id", menteeId)

    if (error) {
      console.error("[DiagnosticSharesService] Error revoking share:", error)
      throw error
    }
  }

  /**
   * Lists diagnostic shares created by the mentee, including mentor profile information.
   *
   * @param supabase - Authenticated Supabase client
   * @param menteeId - ID of the mentee
   * @param target - Optional filters for specific quiz_response_id or diagnostic_session_id
   * @returns Array of shares with mentor profile info
   */
  async listSharesForMentee(
    supabase: SupabaseClient,
    menteeId: string,
    target?: { quizResponseId?: string; diagnosticSessionId?: string }
  ): Promise<DiagnosticShareWithMentor[]> {
    let query = supabase
      .from("diagnostic_shares")
      .select("id, diagnostic_session_id, quiz_response_id, mentee_id, mentor_id, scope, created_at, revoked_at")
      .eq("mentee_id", menteeId)
      .order("created_at", { ascending: false })

    if (target?.quizResponseId) {
      query = query.eq("quiz_response_id", target.quizResponseId)
    }
    if (target?.diagnosticSessionId) {
      query = query.eq("diagnostic_session_id", target.diagnosticSessionId)
    }

    const { data: shares, error } = await query

    if (error) {
      console.error("[DiagnosticSharesService] Error listing mentee shares:", error)
      throw error
    }

    if (!shares || shares.length === 0) return []

    // Fetch mentor profiles for these shares
    const mentorIds = Array.from(new Set(shares.map((s) => s.mentor_id)))
    const { data: mentors } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", mentorIds)

    // Also attempt to get slugs from mentors_view if possible
    const { data: mentorViews } = await supabase
      .from("mentors_view")
      .select("id, slug")
      .in("id", mentorIds)

    const mentorMap = new Map<string, { id: string; full_name: string; email?: string | null; avatar_url?: string | null; slug?: string | null }>()
    for (const m of mentors || []) {
      const slug = mentorViews?.find((v) => v.id === m.id)?.slug || null
      mentorMap.set(m.id, {
        id: m.id,
        full_name: m.full_name || "Mentor",
        email: m.email || null,
        avatar_url: m.avatar_url || null,
        slug
      })
    }

    return shares.map((s) => ({
      ...s,
      mentor: mentorMap.get(s.mentor_id) || {
        id: s.mentor_id,
        full_name: "Mentor",
        email: null,
        avatar_url: null,
        slug: null
      }
    }))
  }

  /**
   * Lists active diagnostic shares received by the mentor, including mentee profile
   * and high-level insights.
   *
   * @param supabase - Authenticated Supabase client (logged in as mentor)
   * @param mentorId - ID of the mentor
   * @returns Array of active shares with mentee info and insights
   */
  async listSharesForMentor(
    supabase: SupabaseClient,
    mentorId: string
  ): Promise<SharedDiagnosticInsight[]> {
    const { data: shares, error } = await supabase
      .from("diagnostic_shares")
      .select("id, diagnostic_session_id, quiz_response_id, mentee_id, mentor_id, scope, created_at, revoked_at")
      .eq("mentor_id", mentorId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[DiagnosticSharesService] Error listing mentor shares:", error)
      throw error
    }

    if (!shares || shares.length === 0) return []

    // 1. Fetch mentee profiles
    const menteeIds = Array.from(new Set(shares.map((s) => s.mentee_id)))
    const { data: mentees } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", menteeIds)

    const menteeMap = new Map<string, { id: string; fullName: string; avatarUrl?: string | null }>()
    for (const m of mentees || []) {
      menteeMap.set(m.id, {
        id: m.id,
        fullName: m.full_name || "Mentorado",
        avatarUrl: m.avatar_url || null
      })
    }

    // 2. Fetch quiz_responses for the shared diagnostics
    const quizResponseIds = shares
      .map((s) => s.quiz_response_id)
      .filter((id): id is string => Boolean(id))

    const sessionIds = shares
      .map((s) => s.diagnostic_session_id)
      .filter((id): id is string => Boolean(id))

    let responsesByQuizId = new Map<string, any>()
    let responsesBySessionId = new Map<string, any>()

    if (quizResponseIds.length > 0 || sessionIds.length > 0) {
      let query = supabase.from("quiz_responses").select("*")

      if (quizResponseIds.length > 0 && sessionIds.length > 0) {
        query = query.or(`id.in.(${quizResponseIds.join(",")}),diagnostic_session_id.in.(${sessionIds.join(",")})`)
      } else if (quizResponseIds.length > 0) {
        query = query.in("id", quizResponseIds)
      } else {
        query = query.in("diagnostic_session_id", sessionIds)
      }

      const { data: responses } = await query
      for (const r of responses || []) {
        if (r.id) responsesByQuizId.set(r.id, r)
        if (r.diagnostic_session_id) responsesBySessionId.set(r.diagnostic_session_id, r)
      }
    }

    return shares.map((s) => {
      const response = s.quiz_response_id
        ? responsesByQuizId.get(s.quiz_response_id)
        : s.diagnostic_session_id
          ? responsesBySessionId.get(s.diagnostic_session_id)
          : null

      const mentee = menteeMap.get(s.mentee_id) || {
        id: s.mentee_id,
        fullName: "Mentorado",
        avatarUrl: null
      }

      const isSummary = s.scope === "summary"
      const rawAnalysis = (response?.ai_analysis as unknown as QuizAnalysisResult) || null

      // Privacy: omit personal life in summary scope
      const personalLifeHelp = isSummary ? null : response?.personal_life_help || null

      return {
        shareId: s.id,
        quizResponseId: s.quiz_response_id,
        diagnosticSessionId: s.diagnostic_session_id,
        scope: s.scope as "summary" | "full",
        createdAt: s.created_at,
        mentee,
        analysis: rawAnalysis,
        developmentAreas: response?.development_areas || rawAnalysis?.areas_desenvolvimento || [],
        currentChallenge: response?.current_challenge || null,
        futureVision: response?.future_vision || null,
        careerMoment: response?.career_moment || null,
        personalLifeHelp
      }
    })
  }

  /**
   * Retrieves a single shared diagnostic insight for a mentor by share ID,
   * guaranteeing read-only access and privacy scope enforcement.
   *
   * @param supabase - Authenticated Supabase client
   * @param mentorId - ID of the mentor
   * @param shareId - UUID of the share
   * @returns SharedDiagnosticInsight or null if revoked/unauthorized
   */
  async getSharedDiagnosticForMentor(
    supabase: SupabaseClient,
    mentorId: string,
    shareId: string
  ): Promise<SharedDiagnosticInsight | null> {
    const { data: share, error } = await supabase
      .from("diagnostic_shares")
      .select("id, diagnostic_session_id, quiz_response_id, mentee_id, mentor_id, scope, created_at, revoked_at")
      .eq("id", shareId)
      .eq("mentor_id", mentorId)
      .is("revoked_at", null)
      .maybeSingle()

    if (error || !share) return null

    // Fetch mentee profile
    const { data: menteeProfile } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("id", share.mentee_id)
      .maybeSingle()

    const mentee = {
      id: share.mentee_id,
      fullName: menteeProfile?.full_name || "Mentorado",
      avatarUrl: menteeProfile?.avatar_url || null
    }

    // Fetch quiz response
    let response: any = null
    if (share.quiz_response_id) {
      const { data } = await supabase
        .from("quiz_responses")
        .select("*")
        .eq("id", share.quiz_response_id)
        .maybeSingle()
      response = data
    } else if (share.diagnostic_session_id) {
      const { data } = await supabase
        .from("quiz_responses")
        .select("*")
        .eq("diagnostic_session_id", share.diagnostic_session_id)
        .maybeSingle()
      response = data
    }

    const isSummary = share.scope === "summary"
    const rawAnalysis = (response?.ai_analysis as unknown as QuizAnalysisResult) || null
    const personalLifeHelp = isSummary ? null : response?.personal_life_help || null

    return {
      shareId: share.id,
      quizResponseId: share.quiz_response_id,
      diagnosticSessionId: share.diagnostic_session_id,
      scope: share.scope as "summary" | "full",
      createdAt: share.created_at,
      mentee,
      analysis: rawAnalysis,
      developmentAreas: response?.development_areas || rawAnalysis?.areas_desenvolvimento || [],
      currentChallenge: response?.current_challenge || null,
      futureVision: response?.future_vision || null,
      careerMoment: response?.career_moment || null,
      personalLifeHelp
    }
  }
}

export const diagnosticSharesService = new DiagnosticSharesService()
