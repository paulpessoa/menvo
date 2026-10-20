import { NextRequest } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireOrgAdmin } from "@/lib/auth/require-org-admin"
import { inviteMemberSchema, memberUserIdSchema, orgIdParamSchema } from "@/lib/schemas/organizations"
import { buildOrgAdminService } from "@/lib/services/organizations/org-admin.composition"
import { errorResponse, handleApiError, successResponse } from "@/lib/api/error-handler"

type Params = { params: Promise<{ id: string }> }

// POST /api/org/[id]/members - invite an existing Menvo account by email.
// If that person already requested to join, this approves them instead.
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const idCheck = orgIdParamSchema.safeParse((await params).id)
    if (!idCheck.success) return errorResponse("Organização inválida", "VALIDATION_ERROR", 400)
    const organizationId = idCheck.data

    const guard = await requireOrgAdmin(organizationId)
    if (!guard.ok) return guard.response

    const validation = inviteMemberSchema.safeParse(await request.json().catch(() => ({})))
    if (!validation.success) {
      return errorResponse(validation.error.errors[0]?.message || "Dados inválidos", "VALIDATION_ERROR", 400)
    }

    const outcome = await buildOrgAdminService(await createClient()).invite(organizationId, validation.data.email)

    switch (outcome.kind) {
      case "no_account":
        return errorResponse(
          "Essa pessoa ainda não tem conta na Menvo. Compartilhe o link público da organização para ela se cadastrar e solicitar participação.",
          "NOT_FOUND",
          404
        )
      case "already_active":
        return successResponse({ status: "active" }, "Essa pessoa já faz parte da organização")
      case "reinvited":
        return successResponse({ status: "invited" }, "Convite reenviado")
      case "approved":
        return successResponse({ status: "active" }, "Solicitação pendente aprovada")
      case "invited":
        return successResponse({ status: "invited" }, "Convite enviado")
    }
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH /api/org/[id]/members - approve a pending request
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const idCheck = orgIdParamSchema.safeParse((await params).id)
    if (!idCheck.success) return errorResponse("Organização inválida", "VALIDATION_ERROR", 400)
    const organizationId = idCheck.data

    const guard = await requireOrgAdmin(organizationId)
    if (!guard.ok) return guard.response

    const validation = memberUserIdSchema.safeParse(await request.json().catch(() => ({})))
    if (!validation.success) return errorResponse("userId inválido", "VALIDATION_ERROR", 400)

    const outcome = await buildOrgAdminService(await createClient()).approve(organizationId, validation.data.userId)
    if (outcome.kind === "not_found") return errorResponse("Solicitação não encontrada", "NOT_FOUND", 404)

    return successResponse({ status: "active" }, "Participação aprovada")
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/org/[id]/members?userId= - remove a member, reject a request,
// or cancel an invite. The last active admin cannot be removed.
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const idCheck = orgIdParamSchema.safeParse((await params).id)
    if (!idCheck.success) return errorResponse("Organização inválida", "VALIDATION_ERROR", 400)
    const organizationId = idCheck.data

    const guard = await requireOrgAdmin(organizationId)
    if (!guard.ok) return guard.response

    const rawUserId = request.nextUrl.searchParams.get("userId")
    if (!rawUserId) return errorResponse("userId é obrigatório", "VALIDATION_ERROR", 400)
    const validation = memberUserIdSchema.safeParse({ userId: rawUserId })
    if (!validation.success) return errorResponse("userId inválido", "VALIDATION_ERROR", 400)
    const { userId } = validation.data

    const outcome = await buildOrgAdminService(await createClient()).remove(guard.admin.userId, organizationId, userId)

    switch (outcome.kind) {
      case "self":
        return errorResponse("Use a aba Organizações do seu perfil para sair da organização", "BAD_REQUEST", 400)
      case "last_admin":
        return errorResponse(
          "Esta pessoa é a única administradora da organização. Indique outra administradora antes de removê-la.",
          "BAD_REQUEST",
          400
        )
      case "removed":
        return successResponse({ userId }, "Membro removido")
    }
  } catch (error) {
    return handleApiError(error)
  }
}
