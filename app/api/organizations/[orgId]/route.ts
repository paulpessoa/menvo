import { createClient } from "@/lib/utils/supabase/server"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { NextRequest, NextResponse } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

// GET /api/organizations/[orgId] - Get organization details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const supabase = await createClient()
    const { orgId } = await params

    // 1. Buscar a Organização (por ID ou Slug)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orgId);
    let query = supabase.from("organizations" as any).select("*");
    
    if (isUuid) {
        query = query.eq("id", orgId);
    } else {
        query = query.eq("slug", orgId);
    }

    const { data: organization, error: orgError } = await (query.single() as any)

    if (orgError || !organization) {
      return errorResponse("Organization not found", "NOT_FOUND", 404)
    }

    const actualOrgId = organization.id;

    // 2. Verificar Permissões
    const { data: { user } } = await supabase.auth.getUser()
    let isAdmin = false
    let isMember = false

    if (user) {
      // Verificar se é Super Admin Global (Menvo Admin)
      const { data: globalRole } = await (supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)
        .single() as any)
      
      const isSuperAdmin = (globalRole as any)?.roles?.name === 'admin'

      const { data: membershipData } = await supabase
        .from("organization_members")
        .select("role, status")
        .eq("organization_id", actualOrgId)
        .eq("user_id", user.id)
        .single()
      
      const membership = membershipData as any

      isAdmin = isSuperAdmin || (membership?.status === 'active' && (membership?.role === "admin" || membership?.role === "moderator"))
      isMember = isSuperAdmin || (membership?.status === 'active')
    }

    // 3. Contagem de Membros
    const { count: memberCount } = await (supabase
      .from("organization_members" as any)
      .select("*", { count: "exact", head: true })
      .eq("organization_id", actualOrgId)
      .eq("status", "active") as any)

    return successResponse({
      organization: organization as any,
      is_admin: isAdmin,
      is_member: isMember,
      member_count: memberCount || 0
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH /api/organizations/[orgId] - Update organization
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const supabase = await createClient()
    const serviceSupabase = createServiceRoleClient()
    const { orgId } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Verificar se é Super Admin ou Admin da Org
    const { data: globalRole } = await (supabase.from('user_roles').select('roles(name)').eq('user_id', user.id).single() as any)
    const isSuperAdmin = (globalRole as any)?.roles?.name === 'admin'

    const { data: membership } = await (supabase
      .from("organization_members")
      .select("role, status")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .single() as any)

    if (!isSuperAdmin && (!membership || membership.role !== "admin" || membership.status !== "active")) {
      return errorResponse("Forbidden", "FORBIDDEN", 403)
    }

    const body = await request.json()

    const { data: organization, error: updateError } = await (serviceSupabase
      .from("organizations" as any)
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq("id", orgId)
      .select()
      .single() as any)

    if (updateError) throw updateError

    return successResponse(organization as any, "Organization updated successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
