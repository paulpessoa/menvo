import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import type { Database } from "@/lib/types/supabase"
import crypto from "crypto"
import { sendOrganizationInvitation } from "@/lib/email/brevo"

import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const supabase = await createClient()
    const { orgId } = await params

    // Pega membros ativos
    const { data: members, error: membersError } = await supabase
      .from("organization_members")
      .select(`
        id,
        user_id,
        role,
        status,
        invited_at,
        user:profiles!user_id(
          id,
          full_name,
          email,
          avatar_url,
          user_roles(roles(name))
        )
      `)
      .eq("organization_id", orgId)

    if (membersError) throw membersError

    // Pega convites pendentes
    const { data: invitations, error: invitesError } = await (supabase
      .from("organization_invitations") as any)
      .select(`
        id,
        email,
        role,
        status,
        invited_at,
        expires_at
      `)
      .eq("organization_id", orgId)
      .eq("status", "pending")

    if (invitesError) throw invitesError

    // Formata a resposta misturando os dois para a UI
    const formattedMembers = (members || []).map((m: any) => ({
      ...m,
      isInvitation: false
    }))

    const formattedInvites = (invitations || []).map((i: any) => ({
      id: i.id,
      user_id: null,
      role: i.role,
      status: "invited",
      invited_at: i.invited_at,
      user: {
        id: "invite-" + i.id,
        full_name: "Aguardando Aceite",
        email: i.email,
        avatar_url: null,
      },
      isInvitation: true
    }))

    return successResponse([...formattedMembers, ...formattedInvites])
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const supabase = await createClient()
    const { orgId } = await params
    const body = await request.json()
    const { email, role, expires_at } = body

    if (!email) {
        return errorResponse("Email is required", "VALIDATION_ERROR", 400)
    }

    const { data: { user } } = await supabase.auth.getUser()

    // Gera um token aleatório para o link do convite
    const token = crypto.randomBytes(32).toString('hex')
    const expiry = expires_at ? new Date(expires_at).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const insertData: any = { 
      organization_id: orgId, 
      email: email,
      role: role || 'member',
      token: token,
      invited_by: user?.id,
      status: 'pending',
      expires_at: expiry
    };

    const { data: invitation, error: insertError } = await (supabase
      .from("organization_invitations") as any)
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') { // Unique violation
        return errorResponse("Este e-mail já possui um convite pendente para esta organização.", "VALIDATION_ERROR", 400)
      }
      throw insertError
    }

    // Dispara E-mail
    try {
      const { data: orgData } = await supabase.from('organizations').select('name').eq('id', orgId).single();
      const { data: profileData } = await supabase.from('profiles').select('full_name').eq('id', user?.id || '').single();
      
      await sendOrganizationInvitation({
        recipientEmail: email,
        recipientName: "Convidado(a)", 
        organizationName: (orgData as any)?.name || "Nossa Organização",
        inviterName: (profileData as any)?.full_name || "Membro da Equipe",
        role: role,
        invitationToken: token
      });
    } catch (emailError) {
      console.error("Erro ao enviar e-mail de convite:", emailError)
      // Não joga erro para não impedir a UI de mostrar sucesso (o convite está no BD)
    }

    return successResponse(invitation, "Convite gerado e e-mail enviado com sucesso")
  } catch (error) {
    return handleApiError(error)
  }
}
