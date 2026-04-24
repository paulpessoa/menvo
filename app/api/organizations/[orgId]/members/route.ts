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
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const from = (page - 1) * limit
    const to = from + limit - 1

    // 1. Pega membros ativos com paginação
    // Forçando o uso do alias !user_id para evitar erro 500 de ambiguidade
    const { data: membersData, error: membersError, count } = await supabase
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
          avatar_url
        )
      `, { count: 'exact' })
      .eq("organization_id", orgId)
      .range(from, to)

    if (membersError) {
        console.error("[API Members] Detailed Members Error:", membersError)
        // Se o join falhar, tenta pegar os membros sem o join de perfil como fallback
        const { data: fallbackData } = await supabase
            .from("organization_members")
            .select("id, user_id, role, status, invited_at")
            .eq("organization_id", orgId)
            .range(from, to)
            
        if (fallbackData) {
            return successResponse({
                members: fallbackData.map((m: any) => ({ ...m, user: { full_name: 'Usuário', email: 'Oculto' } })),
                pagination: { page, limit, total: fallbackData.length, totalPages: 1 }
            })
        }
        throw membersError
    }

    // 2. Pega convites pendentes
    let formattedInvites: any[] = []
    if (page === 1) {
        try {
            const { data: invitations } = await (supabase
              .from("organization_invitations") as any)
              .select("*")
              .eq("organization_id", orgId)
              .eq("status", "pending")

            if (invitations) {
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
        } catch (e) {
            console.warn("[API Members] Failed to fetch invitations, continuing without them")
        }
    }

    // Formata a resposta
    const formattedMembers = (membersData || []).map((m: any) => ({
      ...m,
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
    console.error("[API Members] Global Exception:", error)
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

    if (!email) return errorResponse("Email is required", "VALIDATION_ERROR", 400)

    const { data: { user } } = await supabase.auth.getUser()
    const token = crypto.randomBytes(32).toString('hex')
    const expiry = expires_at ? new Date(expires_at).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: invitation, error: insertError } = await (supabase
      .from("organization_invitations") as any)
      .insert({ 
        organization_id: orgId, 
        email,
        role: role || 'mentee',
        token,
        invited_by: user?.id,
        status: 'pending',
        expires_at: expiry
      })
      .select()
      .single()

    if (insertError) throw insertError

    return successResponse(invitation, "Convite gerado com sucesso")
  } catch (error) {
    return handleApiError(error)
  }
}
