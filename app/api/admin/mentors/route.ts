import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/services/auth/auth.service"
import { getUserFromRequest } from "@/lib/auth/server-utils"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { UUID } from "crypto"

/**
 * GET /api/admin/mentors - lista de mentores para o painel administrativo.
 * Movido de `adminService.getAllMentors`, que consultava `mentors_view`
 * direto do navegador (docs/COMMUNITY_CONTACT_PLAN.md §13).
 *
 * `mentors_view` não carrega mais `email` (ela é legível por visitantes
 * anônimos, migração 20260929160000); o e-mail é buscado em `profiles`, que
 * a RLS permite a um admin ler.
 */
export async function GET() {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const db = await createClient()

    const { data, error } = await db
      .from("mentors_view")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    const mentors = (data || []) as Record<string, unknown>[]

    const ids = mentors
      .map((m) => m.id)
      .filter((id): id is string => typeof id === "string")

    const emailById = new Map<string, string | null>()
    if (ids.length > 0) {
      const { data: emails, error: emailError } = await db
        .from("profiles")
        .select("id, email")
        .in("id", ids)
      if (emailError) throw emailError
      for (const row of emails || []) emailById.set(row.id, row.email)
    }

    const withEmail = mentors.map((m) => ({
      ...m,
      email: (typeof m.id === "string" && emailById.get(m.id)) || null
    }))

    return NextResponse.json({ mentors: withEmail })
  } catch (error: any) {
    console.error("[GET /api/admin/mentors] Erro:", error.message)
    return NextResponse.json({ error: "Não foi possível carregar os mentores" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || !user.role || !["admin", "moderator"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      user_id,
      title,
      company,
      experience_years,
      expertise_areas,
      topics,
      inclusive_tags,
      linkedin_url,
      portfolio_url,
      academic_background,
      current_work,
      areas_of_interest,
      session_duration,
      timezone,
      status = "pending_verification"
    } = body

    if (
      !user_id ||
      !title ||
      !experience_years ||
      !expertise_areas ||
      !topics
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        job_title: title,
        company: company,
        mentorship_topics: topics,
        expertise_areas: expertise_areas,
        linkedin_url,
        timezone,
        verification_status:
          status === "pending_verification" ? "pending" : "approved",
        updated_at: new Date().toISOString()
      })
      .eq("id", user_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 2. Garantir que o usuário tenha a role de mentor
    const { error: roleError } = await supabase.from("user_roles").upsert({
      user_id: user_id as string,
      role_id: 2
    })

    return NextResponse.json({ success: true, mentor: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
