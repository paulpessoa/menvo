import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/utils/supabase/server"
import { createSupabaseReportEvidenceStorage } from "@/lib/ports/adapters/reports-evidence.supabase"
import { ReportsError, uploadEvidence } from "@/lib/services/reports/reports.service"

/**
 * POST /api/reports/evidence - multipart (`file`), returns `{ path }` to send in
 * `evidence_paths`. The path is generated on the server under the caller's id and
 * the upload uses the session client, so the bucket policy applies.
 */
export async function POST(request: Request) {
  const supabase = await createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const form = await request.formData().catch(() => null)
  const file = form?.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo fornecido." }, { status: 400 })
  }

  try {
    const path = await uploadEvidence(createSupabaseReportEvidenceStorage(supabase), user.id, {
      type: file.type,
      size: file.size,
      bytes: async () => new Uint8Array(await file.arrayBuffer()),
    })
    return NextResponse.json({ path })
  } catch (error) {
    if (error instanceof ReportsError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
    }
    console.error("[REPORTS_EVIDENCE_API]", error)
    return NextResponse.json({ error: "Erro ao enviar anexo de evidência." }, { status: 500 })
  }
}
