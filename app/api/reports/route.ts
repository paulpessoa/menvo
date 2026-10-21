import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/utils/supabase/server"
import { createReportsRepository } from "@/lib/repositories/reports.repository"
import { reportCreateSchema } from "@/lib/schemas/reports"
import { createReport, ReportsError } from "@/lib/services/reports/reports.service"

/**
 * POST /api/reports - registers a pending report from the signed-in user.
 * Runs with the caller's client, so the RLS insert policy stays in force.
 */
export async function POST(request: Request) {
  const supabase = await createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body: unknown = await request.json().catch(() => null)
  const parsed = reportCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Categoria e descrição são obrigatórios.", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const reportId = await createReport(createReportsRepository(supabase), user.id, parsed.data)
    // TODO: Disparar email para o Admin informando da denúncia
    return NextResponse.json({ success: true, reportId })
  } catch (error) {
    if (error instanceof ReportsError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
    }
    console.error("[REPORTS_API]", error)
    return NextResponse.json({ error: "Erro ao enviar denúncia." }, { status: 500 })
  }
}
