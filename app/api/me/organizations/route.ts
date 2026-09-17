import { NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/utils/supabase/server"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { getPlatformRole } from "@/lib/services/organizations/org-dashboard.service"
import { sendOrgJoinRequestToAdmin } from "@/lib/email/brevo"
import { errorResponse, handleApiError, successResponse } from "@/lib/api/error-handler"

async function getUser() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  return { supabase, user }
}

// GET /api/me/organizations - every membership row of the caller, with org info
export async function GET() {
  try {
    const { supabase, user } = await getUser()
    if (!user) return errorResponse("Não autenticado", "UNAUTHORIZED", 401)

    const { data, error } = await supabase
      .from("organization_members")
      .select("organization_id, role, status, created_at, organizations(id, slug, name, type, status)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return successResponse(data ?? [])
  } catch (error) {
    return handleApiError(error)
  }
}

const joinSchema = z.object({ slug: z.string().trim().min(1) })

// POST /api/me/organizations - request to join an org by slug, or accept a
// pending invite to it. Idempotent: an existing active membership is a no-op.
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getUser()
    if (!user) return errorResponse("Não autenticado", "UNAUTHORIZED", 401)

    const validation = joinSchema.safeParse(await request.json().catch(() => ({})))
    if (!validation.success) return errorResponse("Slug inválido", "VALIDATION_ERROR", 400)

    const { data: organization } = await supabase
      .from("organizations")
      .select("id, name, join_policy")
      .eq("slug", validation.data.slug)
      .eq("status", "active")
      .maybeSingle()

    if (!organization) return errorResponse("Organização não encontrada", "NOT_FOUND", 404)

    const { data: existing } = await supabase
      .from("organization_members")
      .select("status")
      .eq("organization_id", organization.id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (existing?.status === "active") {
      return successResponse({ status: "active" }, "Você já faz parte desta organização")
    }

    if (existing?.status === "requested") {
      return successResponse({ status: "requested" }, "Sua solicitação já está aguardando aprovação")
    }

    if (existing?.status === "invited") {
      const { error } = await supabase
        .from("organization_members")
        .update({ status: "active" })
        .eq("organization_id", organization.id)
        .eq("user_id", user.id)
      if (error) throw error
      return successResponse({ status: "active" }, `Você agora faz parte da ${organization.name}`)
    }

    if ((organization as any).join_policy === "invite_only") {
      return errorResponse(
        "Esta organização entra apenas por convite. Peça a um administrador dela pra te convidar.",
        "FORBIDDEN",
        403
      )
    }

    const { error: insertError } = await supabase
      .from("organization_members")
      .insert({ organization_id: organization.id, user_id: user.id, role: "member", status: "requested" })
    if (insertError) throw insertError

    // Notify org admins. Needs service role: a regular member can't read other
    // members' rows, and profiles.email of strangers may be RLS-restricted.
    const admin = createServiceRoleClient()
    const [{ data: requester }, { data: admins }] = await Promise.all([
      admin.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
      admin
        .from("organization_members")
        .select("profiles(email)")
        .eq("organization_id", organization.id)
        .eq("role", "admin")
        .eq("status", "active")
    ])

    const requesterName = (requester as any)?.full_name || (requester as any)?.email || "Alguém"
    const requesterEmail = (requester as any)?.email || user.email || ""
    const requesterRole = await getPlatformRole(supabase, user.id)
    await Promise.all(
      ((admins ?? []) as any[])
        .map(a => a.profiles?.email)
        .filter(Boolean)
        .map(adminEmail =>
          sendOrgJoinRequestToAdmin({ adminEmail, requesterName, requesterEmail, orgName: organization.name, requesterRole }).catch(() => null)
        )
    )

    return successResponse({ status: "requested" }, "Solicitação enviada — aguarde a aprovação da organização")
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/me/organizations?organizationId= - leave, decline an invite, or
// withdraw a request.
export async function DELETE(request: NextRequest) {
  try {
    const { supabase, user } = await getUser()
    if (!user) return errorResponse("Não autenticado", "UNAUTHORIZED", 401)

    const organizationId = request.nextUrl.searchParams.get("organizationId")
    if (!organizationId) return errorResponse("organizationId é obrigatório", "VALIDATION_ERROR", 400)

    const { error } = await supabase
      .from("organization_members")
      .delete()
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
    if (error) throw error

    return successResponse({ organizationId }, "Você saiu da organização")
  } catch (error) {
    return handleApiError(error)
  }
}
