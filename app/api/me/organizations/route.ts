import { NextRequest } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { errorResponse, handleApiError, successResponse } from "@/lib/api/error-handler"
import { joinOrganizationSchema, leaveOrganizationQuerySchema } from "@/lib/schemas/organizations"
import { buildMembershipService } from "@/lib/services/organizations/membership.composition"

/** Quem está logado, ou `null`. O service recebe só este ator, nunca um id do corpo da requisição. */
async function getActor() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  return { supabase, actor: user ? { id: user.id, email: user.email ?? null } : null }
}

// GET /api/me/organizations - every membership row of the caller, with org info
export async function GET() {
  try {
    const { supabase, actor } = await getActor()
    if (!actor) return errorResponse("Não autenticado", "UNAUTHORIZED", 401)

    return successResponse(await buildMembershipService(supabase).listMine(actor))
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/me/organizations - request to join an org by slug, or accept a
// pending invite to it. Idempotent: an existing active membership is a no-op.
export async function POST(request: NextRequest) {
  try {
    const { supabase, actor } = await getActor()
    if (!actor) return errorResponse("Não autenticado", "UNAUTHORIZED", 401)

    const validation = joinOrganizationSchema.safeParse(await request.json().catch(() => ({})))
    if (!validation.success) return errorResponse("Slug inválido", "VALIDATION_ERROR", 400)

    const outcome = await buildMembershipService(supabase).join(actor, validation.data.slug)

    switch (outcome.kind) {
      case "not_found":
        return errorResponse("Organização não encontrada", "NOT_FOUND", 404)
      case "already_active":
        return successResponse({ status: "active" }, "Você já faz parte desta organização")
      case "already_requested":
        return successResponse({ status: "requested" }, "Sua solicitação já está aguardando aprovação")
      case "accepted":
        return successResponse({ status: "active" }, `Você agora faz parte da ${outcome.orgName}`)
      case "invite_only":
        return errorResponse(
          "Esta organização entra apenas por convite. Peça a um administrador dela pra te convidar.",
          "FORBIDDEN",
          403
        )
      case "requested":
        return successResponse({ status: "requested" }, "Solicitação enviada - aguarde a aprovação da organização")
    }
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/me/organizations?organizationId= - leave, decline an invite, or
// withdraw a request.
export async function DELETE(request: NextRequest) {
  try {
    const { supabase, actor } = await getActor()
    if (!actor) return errorResponse("Não autenticado", "UNAUTHORIZED", 401)

    const rawId = request.nextUrl.searchParams.get("organizationId")
    const validation = leaveOrganizationQuerySchema.safeParse({ organizationId: rawId ?? "" })
    if (!validation.success) {
      return errorResponse(rawId ? "organizationId inválido" : "organizationId é obrigatório", "VALIDATION_ERROR", 400)
    }

    await buildMembershipService(supabase).leave(actor, validation.data.organizationId)

    return successResponse({ organizationId: validation.data.organizationId }, "Você saiu da organização")
  } catch (error) {
    return handleApiError(error)
  }
}
