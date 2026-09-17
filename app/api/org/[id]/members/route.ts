import { NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/utils/supabase/server"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { requireOrgAdmin } from "@/lib/auth/require-org-admin"
import { getPlatformRole } from "@/lib/services/organizations/org-dashboard.service"
import { sendOrgInvite, sendOrgMembershipApproved } from "@/lib/email/brevo"
import { errorResponse, handleApiError, successResponse } from "@/lib/api/error-handler"

type Params = { params: Promise<{ id: string }> }

const inviteSchema = z.object({ email: z.string().trim().email("E-mail inválido") })
const approveSchema = z.object({ userId: z.string().uuid() })

async function getOrgName(organizationId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from("organizations").select("name").eq("id", organizationId).maybeSingle()
  return data?.name ?? "a organização"
}

// POST /api/org/[id]/members - invite an existing Menvo account by email.
// If that person already requested to join, this approves them instead.
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: organizationId } = await params
    const guard = await requireOrgAdmin(organizationId)
    if (!guard.ok) return guard.response

    const validation = inviteSchema.safeParse(await request.json().catch(() => ({})))
    if (!validation.success) {
      return errorResponse(validation.error.errors[0]?.message || "Dados inválidos", "VALIDATION_ERROR", 400)
    }

    // Email lookup across all profiles needs service role (RLS may hide
    // strangers' rows from an org admin who isn't a platform admin).
    const admin = createServiceRoleClient()
    const { data: profile } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .eq("email", validation.data.email)
      .maybeSingle()

    if (!profile) {
      return errorResponse(
        "Essa pessoa ainda não tem conta na Menvo. Compartilhe o link público da organização para ela se cadastrar e solicitar participação.",
        "NOT_FOUND",
        404
      )
    }

    const supabase = await createClient()
    const { data: existing } = await supabase
      .from("organization_members")
      .select("status")
      .eq("organization_id", organizationId)
      .eq("user_id", profile.id)
      .maybeSingle()

    const orgName = await getOrgName(organizationId)
    const personName = (profile as any).full_name || (profile as any).email
    const recipientRole = (await getPlatformRole(supabase, profile.id)) ?? "mentee"

    if (existing?.status === "active") {
      return successResponse({ status: "active" }, "Essa pessoa já faz parte da organização")
    }

    if (existing?.status === "invited") {
      await sendOrgInvite({ name: personName, email: (profile as any).email, orgName, recipientRole }).catch(() => null)
      return successResponse({ status: "invited" }, "Convite reenviado")
    }

    if (existing?.status === "requested") {
      const { error } = await supabase
        .from("organization_members")
        .update({ status: "active" })
        .eq("organization_id", organizationId)
        .eq("user_id", profile.id)
      if (error) throw error
      await sendOrgMembershipApproved({ name: personName, email: (profile as any).email, orgName, recipientRole }).catch(() => null)
      return successResponse({ status: "active" }, "Solicitação pendente aprovada")
    }

    const { error: insertError } = await supabase
      .from("organization_members")
      .insert({ organization_id: organizationId, user_id: profile.id, role: "member", status: "invited" })
    if (insertError) throw insertError

    await sendOrgInvite({ name: personName, email: (profile as any).email, orgName, recipientRole }).catch(() => null)

    return successResponse({ status: "invited" }, "Convite enviado")
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH /api/org/[id]/members - approve a pending request
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id: organizationId } = await params
    const guard = await requireOrgAdmin(organizationId)
    if (!guard.ok) return guard.response

    const validation = approveSchema.safeParse(await request.json().catch(() => ({})))
    if (!validation.success) return errorResponse("userId inválido", "VALIDATION_ERROR", 400)

    const supabase = await createClient()
    const { data: updated, error } = await supabase
      .from("organization_members")
      .update({ status: "active" })
      .eq("organization_id", organizationId)
      .eq("user_id", validation.data.userId)
      .eq("status", "requested")
      .select("user_id, profiles(full_name, email)")
      .maybeSingle()
    if (error) throw error
    if (!updated) return errorResponse("Solicitação não encontrada", "NOT_FOUND", 404)

    const person = (updated as any).profiles
    if (person?.email) {
      const orgName = await getOrgName(organizationId)
      const recipientRole = (await getPlatformRole(supabase, validation.data.userId)) ?? "mentee"
      await sendOrgMembershipApproved({ name: person.full_name || person.email, email: person.email, orgName, recipientRole }).catch(() => null)
    }

    return successResponse({ status: "active" }, "Participação aprovada")
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/org/[id]/members?userId= - remove a member, reject a request,
// or cancel an invite.
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id: organizationId } = await params
    const guard = await requireOrgAdmin(organizationId)
    if (!guard.ok) return guard.response

    const userId = request.nextUrl.searchParams.get("userId")
    if (!userId) return errorResponse("userId é obrigatório", "VALIDATION_ERROR", 400)

    if (userId === guard.admin.userId) {
      return errorResponse("Use a aba Organizações do seu perfil para sair da organização", "BAD_REQUEST", 400)
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from("organization_members")
      .delete()
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
    if (error) throw error

    return successResponse({ userId }, "Membro removido")
  } catch (error) {
    return handleApiError(error)
  }
}
