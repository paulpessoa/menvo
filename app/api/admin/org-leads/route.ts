import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { createClient } from "@/lib/utils/supabase/server"
import { orgLeadPatchBodySchema } from "@/lib/schemas/admin"
import { adminForbiddenResponse } from "@/lib/services/admin/assert-admin"
import { buildAdminOrganizationsService } from "@/lib/services/admin/ops.composition"

/** Traduz o erro do service; erro de banco não vaza a mensagem do driver. */
function failure(error: unknown, context: string) {
  const forbidden = adminForbiddenResponse(error)
  if (forbidden) return forbidden
  console.error(`[${context}] Error:`, error)
  return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
}

/** GET /api/admin/org-leads - pedidos de organização, filtráveis por `?status=`. */
export async function GET(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") || undefined

  try {
    const service = buildAdminOrganizationsService(await createClient())
    const leads = await service.listOrgLeads(status)
    return NextResponse.json({ leads }, { status: 200 })
  } catch (error) {
    return failure(error, "GET /api/admin/org-leads")
  }
}

/** PATCH /api/admin/org-leads - muda o status de um pedido. */
export async function PATCH(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const body = orgLeadPatchBodySchema.safeParse(await request.json().catch(() => null))
  if (!body.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 })
  }

  try {
    const service = buildAdminOrganizationsService(await createClient())
    const lead = await service.setOrgLeadStatus(body.data.id, body.data.status)
    if (!lead) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    return NextResponse.json({ lead }, { status: 200 })
  } catch (error) {
    return failure(error, "PATCH /api/admin/org-leads")
  }
}
