import { NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import {
  featureFlagCreateBodySchema,
  featureFlagDeleteQuerySchema,
  featureFlagToggleBodySchema
} from "@/lib/schemas/admin"
import { adminForbiddenResponse } from "@/lib/services/admin/assert-admin"
import { FeatureFlagNotFoundError } from "@/lib/services/admin/feature-flags.service"
import { buildAdminFeatureFlagsService } from "@/lib/services/admin/ops.composition"

/** Traduz o erro do service para a resposta; erro de banco não vaza mensagem. */
function errorResponse(error: unknown, context: string) {
  const forbidden = adminForbiddenResponse(error)
  if (forbidden) return forbidden
  if (error instanceof FeatureFlagNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  console.error(`[${context}] Error:`, error)
  return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
}

const invalid = (message: string) => NextResponse.json({ error: message }, { status: 400 })

/** GET /api/admin/feature-flags - flags e últimas linhas da trilha de auditoria. */
export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  try {
    const service = buildAdminFeatureFlagsService(await createClient())
    return NextResponse.json(await service.listFlagsWithLogs())
  } catch (error) {
    return errorResponse(error, "GET /api/admin/feature-flags")
  }
}

/** POST /api/admin/feature-flags - cria uma flag (sempre desligada). */
export async function POST(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const body = featureFlagCreateBodySchema.safeParse(await request.json().catch(() => null))
  if (!body.success) return invalid(body.error.issues[0]?.message ?? "Dados inválidos")

  try {
    const service = buildAdminFeatureFlagsService(await createClient())
    const data = await service.createFlag(guard.admin.userId, body.data)
    return NextResponse.json({ data })
  } catch (error) {
    return errorResponse(error, "POST /api/admin/feature-flags")
  }
}

/** PUT /api/admin/feature-flags - liga ou desliga uma flag. */
export async function PUT(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const body = featureFlagToggleBodySchema.safeParse(await request.json().catch(() => null))
  if (!body.success) return invalid("id e enabled são obrigatórios")

  try {
    const service = buildAdminFeatureFlagsService(await createClient())
    await service.setFlagEnabled(guard.admin.userId, body.data.id, body.data.enabled)
    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error, "PUT /api/admin/feature-flags")
  }
}

/** DELETE /api/admin/feature-flags?id= - apaga uma flag. */
export async function DELETE(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const query = featureFlagDeleteQuerySchema.safeParse({
    id: new URL(request.url).searchParams.get("id")
  })
  if (!query.success) return invalid("ID is required")

  try {
    const service = buildAdminFeatureFlagsService(await createClient())
    await service.deleteFlag(guard.admin.userId, query.data.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error, "DELETE /api/admin/feature-flags")
  }
}
