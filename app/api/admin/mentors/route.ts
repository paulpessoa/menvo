import { NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"

/**
 * GET /api/admin/mentors - lista de mentores para o painel administrativo.
 * Movido de `adminService.getAllMentors`, que consultava `mentors_view`
 * direto do navegador (docs/COMMUNITY_CONTACT_PLAN.md §13).
 *
 * `mentors_view` não carrega mais `email` (ela é legível por visitantes
 * anônimos, migração 20260929160000); o e-mail é buscado em `profiles`, que
 * a RLS permite a um admin ler.
 *
 * Não há POST: candidaturas a mentor são decididas só por POST
 * /api/admin/verify (papel, publicação do perfil e aviso à pessoa).
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
