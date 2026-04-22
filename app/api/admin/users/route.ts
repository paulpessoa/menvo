import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Verificar autenticação e role admin
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse("Unauthorized", "UNAUTHORIZED", 401)
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id)
      .returns<any>()
      .single()

    const userRole = (roleData?.roles as any)?.name
    if (userRole !== "admin" && userRole !== "moderator") {
      return errorResponse("Forbidden", "FORBIDDEN", 403)
    }

    // 2. Buscar parâmetros de paginação e filtro
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const tab = searchParams.get("tab") || "all" // all, pending, mentors, mentees
    const search = searchParams.get("search") || ""

    const from = (page - 1) * limit
    const to = from + limit - 1

    // 3. Query base
    let query = supabase
      .from("profiles")
      .select(`
        *,
        user_roles!inner (
          roles!inner (
            name
          )
        )
      `, { count: "exact" })

    // Filtros por aba
    if (tab === "pending") {
      query = query.eq("verified", false).eq("user_roles.roles.name", "mentor")
    } else if (tab === "mentors") {
      query = query.eq("user_roles.roles.name", "mentor")
    } else if (tab === "mentees") {
      query = query.eq("user_roles.roles.name", "mentee")
    }

    // Filtro de busca
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: profiles, error: profilesError, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to)

    if (profilesError) throw profilesError

    // 4. Buscar contagens para as abas
    const { count: totalCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })

    const { count: pendingCount } = await supabase
      .from("profiles")
      .select("*, user_roles!inner(roles!inner(name))", { count: "exact", head: true })
      .eq("verified", false)
      .eq("user_roles.roles.name", "mentor")

    const { count: mentorsCount } = await supabase
      .from("profiles")
      .select("*, user_roles!inner(roles!inner(name))", { count: "exact", head: true })
      .eq("user_roles.roles.name", "mentor")

    const { count: menteesCount } = await supabase
      .from("profiles")
      .select("*, user_roles!inner(roles!inner(name))", { count: "exact", head: true })
      .eq("user_roles.roles.name", "mentee")

    return successResponse({
      users: profiles,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      counts: {
        all: totalCount || 0,
        pending: pendingCount || 0,
        mentors: mentorsCount || 0,
        mentees: menteesCount || 0
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
