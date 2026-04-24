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
    
    // Pegar parâmetros de paginação
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const from = (page - 1) * limit
    const to = from + limit - 1

    // 1. Pega membros ativos com paginação
    // Simplificando o join para evitar erros de alias
    const { data: members, error: membersError, count } = await supabase
      .from("organization_members")
      .select(`
        id,
        user_id,
        role,
        status,
        invited_at,
        profiles(
          id,
          full_name,
          email,
          avatar_url
        )
      `, { count: 'exact' })
      .eq("organization_id", orgId)
      .range(from, to)

    if (membersError) {
        console.error("[API Members] Error fetching members:", membersError)
        throw membersError
    }

    // 2. Pega convites pendentes (apenas na página 1 para simplificar)
    let formattedInvites: any[] = []
    if (page === 1) {
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

        if (!invitesError && invitations) {
            formattedInvites = invitations.map((i: any) => ({
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
        }
    }

    // Formata a resposta misturando os dois para a UI
    const formattedMembers = (members || []).map((m: any) => ({
      ...m,
      user: m.profiles, // Ajustando o campo do join simplificado
      isInvitation: false
    }))

    return successResponse({
        members: [...formattedMembers, ...formattedInvites],
        pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
        }
    })
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

    const token = crypto.randomBytes(32).toString('hex')
    const expiry = expires_at ? new Date(expires_at).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const insertData: any = { 
      organization_id: orgId, 
      email: email,
      role: role || 'mentee',
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
      if (insertError.code === '23505') {
        return errorResponse("Este e-mail já possui um convite pendente para esta organização.", "VALIDATION_ERROR", 400)
      }
      throw insertError
    }

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
    }

    return successResponse(invitation, "Convite gerado e e-mail enviado com sucesso")
  } catch (error) {
    return handleApiError(error)
  }
}
