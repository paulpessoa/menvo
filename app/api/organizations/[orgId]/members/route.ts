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
    const serviceSupabase = createServiceRoleClient()
    const { orgId: rawOrgId } = await params
    
    // 1. Detectar se é ID ou Slug e resolver o ID real
    let actualOrgId = rawOrgId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawOrgId);
    
    if (!isUuid) {
        const { data: orgData } = await serviceSupabase
            .from("organizations")
            .select("id")
            .eq("slug", rawOrgId)
            .single();
        if (orgData) actualOrgId = orgData.id;
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const from = (page - 1) * limit
    const to = from + limit - 1

    // 2. VERIFICAÇÃO DE SEGURANÇA MANUAL
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return errorResponse("Unauthorized", "UNAUTHORIZED", 401)

    // Verificar se é Super Admin Global
    const { data: globalRole } = await (supabase.from('user_roles').select('roles(name)').eq('user_id', user.id).single() as any)
    const isSuperAdmin = (globalRole as any)?.roles?.name === 'admin'

    // Verificar se é Admin da Organização
    const { data: membership } = await (supabase.from("organization_members").select("role, status").eq("organization_id", actualOrgId).eq("user_id", user.id).single() as any)
    const isAdmin = isSuperAdmin || (membership?.status === 'active' && (membership?.role === 'admin' || membership?.role === 'moderator'))

    if (!isAdmin) {
        return errorResponse("Forbidden", "FORBIDDEN", 403)
    }

    // 3. BUSCA DE DADOS
    const { data: members, error: membersError, count } = await serviceSupabase
      .from("organization_members")
      .select("*", { count: 'exact' })
      .eq("organization_id", actualOrgId)
      .range(from, to)

    if (membersError) throw membersError

    // 4. BUSCAR PERFIS
    let formattedMembers: any[] = []
    if (members && members.length > 0) {
        const userIds = (members as any[]).map(m => m.user_id).filter(Boolean)
        const { data: profiles } = await serviceSupabase
            .from("profiles")
            .select("id, full_name, email, avatar_url")
            .in("id", userIds)

        formattedMembers = (members as any[]).map(m => ({
            ...m,
            user: (profiles as any[])?.find((p: any) => p.id === m.user_id) || { full_name: 'Usuário', email: 'Oculto' },
            isInvitation: false
        }))
    }

    return successResponse({
        members: formattedMembers,
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
