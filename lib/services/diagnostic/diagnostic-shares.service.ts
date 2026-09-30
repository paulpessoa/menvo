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
   * @param mentorId - ID of the mentor, kept for the caller's symmetry; the RPC
   *   derives the mentor from `auth.uid()` and ignores anything passed here.
   * @returns Array of active shares with mentee info and insights
   */
  async listSharesForMentor(
    supabase: SupabaseClient,
    mentorId: string
  ): Promise<SharedDiagnosticInsight[]> {
    const { data, error } = await supabase.rpc("get_shared_diagnostics_for_mentor", {
      p_share_id: null
    })

    if (error) {
      console.error("[DiagnosticSharesService] Error listing mentor shares:", error)
      throw error
    }

    return (data || []).map(mapSharedDiagnosticRow)
  }

  /**
   * Retrieves a single shared diagnostic insight for a mentor by share ID,
   * guaranteeing read-only access and privacy scope enforcement.
   *
   * @param supabase - Authenticated Supabase client
   * @param mentorId - ID of the mentor, kept for the caller's symmetry; the RPC
   *   derives the mentor from `auth.uid()` and ignores anything passed here.
   * @param shareId - UUID of the share
   * @returns SharedDiagnosticInsight or null if revoked/unauthorized
   */
  async getSharedDiagnosticForMentor(
    supabase: SupabaseClient,
    mentorId: string,
    shareId: string
  ): Promise<SharedDiagnosticInsight | null> {
    const { data, error } = await supabase.rpc("get_shared_diagnostics_for_mentor", {
      p_share_id: shareId
    })

    if (error) {
      console.error("[DiagnosticSharesService] Error loading mentor share:", error)
      return null
    }

    const row = Array.isArray(data) ? data[0] : data
    if (!row) return null

    return mapSharedDiagnosticRow(row)
  }
}

/**
 * One row of `get_shared_diagnostics_for_mentor` -> the shape the mentor UI
 * consumes. The row already has `personal_life_help` blanked by the database
 * for a 'summary' share, and never carries the mentee's name, e-mail or
 * LinkedIn: this mapping only renames fields, it is not where privacy is
 * decided (migration 20260930000001).
 */
function mapSharedDiagnosticRow(row: any): SharedDiagnosticInsight {
  const analysis = (row.analysis as unknown as QuizAnalysisResult) || null

  return {
    shareId: row.share_id,
    quizResponseId: row.quiz_response_id,
    diagnosticSessionId: row.diagnostic_session_id,
    scope: row.scope as "summary" | "full",
    createdAt: row.created_at,
    mentee: {
      id: row.mentee_id,
      fullName: row.mentee_full_name || "Mentorado",
      avatarUrl: row.mentee_avatar_url || null
    },
    analysis,
    developmentAreas: row.development_areas || analysis?.areas_desenvolvimento || [],
    currentChallenge: row.current_challenge || null,
    futureVision: row.future_vision || null,
    careerMoment: row.career_moment || null,
    personalLifeHelp: row.personal_life_help || null
  }
}

export const diagnosticSharesService = new DiagnosticSharesService()
