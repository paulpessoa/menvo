import { NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import type { Database } from "@/lib/types/supabase"
import type { Verification } from "@/lib/types/models/verification"

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]

/**
 * GET /api/admin/verifications/pending - mentor applications awaiting
 * review. Moved from `VerificationService.getPendingVerifications`, which
 * queried `profiles` straight from the browser (docs/COMMUNITY_CONTACT_PLAN.md §13).
 */
export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("verification_status", ["approved", "rejected"])
    .order("updated_at", { ascending: false })
    .limit(100)
    .returns<ProfileRow[]>()

  if (error) {
    console.error("[GET /api/admin/verifications/pending] Erro:", error.message)
    return NextResponse.json({ error: "Não foi possível carregar as verificações" }, { status: 500 })
  }

  const verifications: Verification[] = (data || []).map((profile) => ({
    id: profile.id,
    mentor_id: profile.id,
    mentor_name:
      profile.full_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Mentor",
    mentor_email: profile.email || "",
    mentor_title: profile.job_title || "Mentor",
    mentor_company: profile.company || "",
    mentor_bio: profile.bio,
    mentor_expertise_areas: profile.expertise_areas,
    mentorship_approach: profile.mentorship_approach,
    what_to_expect: profile.what_to_expect,
    linkedin_url: profile.linkedin_url,
    cv_url: profile.cv_url,
    verification_type: "Identity",
    status: profile.verification_status as any,
    created_at: profile.created_at || new Date().toISOString(),
    updated_at: profile.updated_at || new Date().toISOString()
  } as Verification))

  return NextResponse.json({ verifications })
}
