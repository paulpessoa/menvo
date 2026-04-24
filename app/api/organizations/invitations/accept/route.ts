import { createClient } from "@/lib/utils/supabase/server"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { NextRequest, NextResponse } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const serviceSupabase = createServiceRoleClient()

    // 1. Autenticar usuário
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401)
    }

    const body = await request.json()
    const { invitation_token } = body

    if (!invitation_token) {
      return errorResponse("Invitation token is required", "VALIDATION_ERROR", 400)
    }

    // 2. Buscar convite
    const { data: invitation, error: inviteError } = await (serviceSupabase
      .from("organization_invitations") as any)
      .select(`
        *,
        organization:organizations(id, name, slug, logo_url, status)
      `)
      .eq("token", invitation_token)
      .single()

    if (inviteError || !invitation) {
      return errorResponse("Invalid invitation token", "INVALID_TOKEN", 400)
    }

    // 3. Validar status e validade
    if (invitation.status !== "pending") {
      return errorResponse("Invitation is no longer valid", "INVALID_TOKEN", 400)
    }

    if (new Date() > new Date(invitation.expires_at)) {
        return errorResponse("Invitation has expired", "TOKEN_EXPIRED", 400)
    }

    // 4. Inserir usuário como membro ativo
    const insertData: any = {
      organization_id: invitation.organization_id,
      user_id: user.id,
      role: invitation.role,
      status: "active",
      invited_at: invitation.invited_at,
      invited_by: invitation.invited_by,
      activated_at: new Date().toISOString()
    };

    const { data: newMember, error: insertError } = await (serviceSupabase
      .from("organization_members") as any)
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
       // Check for duplicate key if user is already a member
       if (insertError.code === '23505') {
           return errorResponse("Você já é membro desta organização.", "ALREADY_MEMBER", 400)
       }
       throw insertError
    }

    // 5. Atualizar convite para aceito
    await (serviceSupabase
      .from("organization_invitations") as any)
      .update({ status: 'accepted' })
      .eq('id', invitation.id)

    // 6. Verificar se o perfil está completo para sugerir onboarding
    const { data: profileResult } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      
    const profile = profileResult as any;

    const needsOnboarding =
      !profile ||
      !profile.first_name ||
      !profile.last_name ||
      (invitation.role === "mentor" && !profile.bio)

    return successResponse(
      {
        member: newMember,
        organization: invitation.organization,
        needsOnboarding
      },
      "Invitation accepted successfully"
    )
  } catch (error) {
    return handleApiError(error)
  }
}
