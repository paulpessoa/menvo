import { createClient } from "@/lib/utils/supabase/server"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { NextRequest, NextResponse } from "next/server"

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
    // Service Role Client para bypassar RLS problemático na listagem de membros
    const serviceSupabase = createServiceRoleClient()
    const { orgId } = await params
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const from = (page - 1) * limit
    const to = from + limit - 1

    // 1. VERIFICAÇÃO DE SEGURANÇA MANUAL (Já que vamos bypassar o RLS do banco)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401)

    // Verificar se é Super Admin Global
    const { data: globalRole } = await (supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)
        .single() as any)
    const isSuperAdmin = (globalRole as any)?.roles?.name === 'admin'

    // Verificar se é Admin da Organização
    const { data: membership } = await (supabase
        .from("organization_members")
        .select("role, status")
        .eq("organization_id", orgId)
        .eq("user_id", user.id)
        .single() as any)
    const isAdmin = isSuperAdmin || (membership?.status === 'active' && (membership?.role === 'admin' || membership?.role === 'moderator'))

    if (!isAdmin) {
        return errorResponse("Forbidden: You do not have permission to view member list", "FORBIDDEN", 403)
    }

    // 2. BUSCA DE DADOS COM SERVICE ROLE (Bypassa RLS para garantir que os dados apareçam)
    const { data: members, error: membersError, count } = await serviceSupabase
      .from("organization_members")
      .select("*", { count: 'exact' })
      .eq("organization_id", orgId)
      .range(from, to)

    if (membersError) throw membersError

    // 3. BUSCAR PERFIS
    let formattedMembers: any[] = []
    if (members && members.length > 0) {
        const userIds = members.map(m => m.user_id).filter(Boolean)
        const { data: profiles } = await serviceSupabase
            .from("profiles")
            .select("id, full_name, email, avatar_url")
            .in("id", userIds)

        formattedMembers = members.map(m => ({
            ...m,
            user: profiles?.find(p => p.id === m.user_id) || { full_name: 'Usuário', email: 'Oculto' },
            isInvitation: false
        }))
    }

    // 4. CONVITES PENDENTES
    let formattedInvites: any[] = []
    if (page === 1) {
        const { data: invitations } = await (serviceSupabase.from("organization_invitations") as any).select("*").eq("organization_id", orgId).eq("status", "pending")
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
    console.error("[API Members] Error:", error)
    return handleApiError(error)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const serviceSupabase = createServiceRoleClient()
    const { orgId } = await params
    const body = await request.json()
    const { email, role } = body
    if (!email) return errorResponse("Email is required", "VALIDATION_ERROR", 400)

    const { data: invitation, error: insertError } = await (serviceSupabase
      .from("organization_invitations") as any)
      .insert({ organization_id: orgId, email, role: role || 'mentee', status: 'pending' })
      .select()
      .single()

    if (insertError) throw insertError
    return successResponse(invitation, "Convite gerado com sucesso")
  } catch (error) {
    return handleApiError(error)
  }
}
