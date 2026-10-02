import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import type { Verification } from "@/lib/types/models/verification"
import { fetchCvUrls } from "@/lib/services/mentees/mentee-cv.service"

type MentorStatus = "pending" | "approved" | "rejected"

const SELECT = `
  user_id, verification_status, mentorship_approach, what_to_expect, created_at, updated_at,
  profiles!inner(id, email, full_name, first_name, last_name, job_title, company, bio,
                 expertise_areas, linkedin_url, created_at)
`

/**
 * Lista candidaturas de mentor por status para as filas do admin. Lê de
 * `mentor_profiles`: verificação só existe para quem pediu para ser mentor,
 * então os mentorados com o antigo `profiles.verification_status = 'approved'`
 * não aparecem mais em "concluídas".
 *
 * Usa o cliente da sessão do admin (policy `is_admin()` nas duas tabelas);
 * o chamador precisa estar protegido por `requireAdmin()`.
 */
export async function listMentorVerifications(
  supabase: SupabaseClient<Database>,
  statuses: MentorStatus[],
  { limit = 100 }: { limit?: number } = {}
): Promise<Verification[]> {
  const { data, error } = await supabase
    .from("mentor_profiles")
    .select(SELECT)
    .in("verification_status", statuses)
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  const cvUrls = await fetchCvUrls((data ?? []).map((row) => row.user_id))

  return (data ?? []).map((row) => {
    const profile = row.profiles
    return {
      id: row.user_id,
      mentor_id: row.user_id,
      mentor_name:
        profile.full_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Mentor",
      mentor_email: profile.email || "",
      mentor_title: profile.job_title || "Mentor",
      mentor_company: profile.company || "",
      mentor_bio: profile.bio,
      mentor_expertise_areas: profile.expertise_areas,
      mentorship_approach: row.mentorship_approach,
      what_to_expect: row.what_to_expect,
      linkedin_url: profile.linkedin_url,
      cv_url: cvUrls.get(row.user_id) ?? null,
      verification_type: "Identity",
      status: row.verification_status ?? "pending",
      created_at: profile.created_at || row.created_at,
      updated_at: row.updated_at,
    }
  })
}
