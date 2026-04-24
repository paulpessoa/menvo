import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

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
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const from = (page - 1) * limit
    const to = from + limit - 1

    // 1. Pega membros ativos (Query simples, sem Join para evitar erro 500/vazio)
    const { data: membersData, error: membersError, count } = await supabase
      .from("organization_members")
      .select("*", { count: 'exact' })
      .eq("organization_id", orgId)
      .range(from, to)

    if (membersError) throw membersError
    const members = membersData as any[] | null;

    // 2. Buscar perfis dos membros encontrados
    let formattedMembers: any[] = []
    if (members && members.length > 0) {
        const userIds = (members as any[]).map(m => m.user_id).filter(Boolean)
        const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, email, avatar_url")
            .in("id", userIds)

        formattedMembers = (members as any[]).map(m => ({
            ...m,
            user: (profiles as any[])?.find((p: any) => p.id === m.user_id) || { full_name: 'Usuário', email: 'Oculto' },
            isInvitation: false
        }))
    }

    // 3. Pega convites pendentes
    let formattedInvites: any[] = []
    if (page === 1) {
        const { data: invitations } = await (supabase.from("organization_invitations") as any).select("*").eq("organization_id", orgId).eq("status", "pending")
        if (invitations) {
            formattedInvites = invitations.map((i: any) => ({
              id: i.id,
              user_id: null,
              role: i.role,
              status: "invited",
              user: { id: "invite-" + i.id, full_name: "Aguardando Aceite", email: i.email },
              isInvitation: true
            }))
        }
    }

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
    const { email, role } = body

    if (!email) return errorResponse("Email is required", "VALIDATION_ERROR", 400)

    const { data: invitation, error: insertError } = await (supabase
      .from("organization_invitations") as any)
      .insert({ 
        organization_id: orgId, 
        email,
        role: role || 'mentee',
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) throw insertError
    return successResponse(invitation, "Convite gerado com sucesso")
  } catch (error) {
    return handleApiError(error)
  }
}
