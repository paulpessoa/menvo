import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { adminForbiddenResponse } from "@/lib/services/admin/assert-admin"
import { buildAdminEmailsService } from "@/lib/services/admin/ops.composition"

/** GET /api/admin/emails/preview?template= - HTML do modelo com dados de exemplo. */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { searchParams } = new URL(request.url)
  const template = searchParams.get("template") || "confirmation"

  try {
    const service = buildAdminEmailsService(await createClient())
    const html = await service.previewTemplate(template)

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, max-age=0"
      }
    })
  } catch (error) {
    const forbidden = adminForbiddenResponse(error)
    if (forbidden) return forbidden
    console.error("[GET /api/admin/emails/preview] Error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
