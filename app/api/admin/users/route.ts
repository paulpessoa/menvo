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
      .returns<{ roles: { name: string } | null }[]>()
      .single()

    const userRole = roleData?.roles?.name
    if (userRole !== "admin" && userRole !== "moderator") {
      return errorResponse("Forbidden", "FORBIDDEN", 403)
    }

    // 2. Buscar parâmetros de paginação e filtro
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const tab = searchParams.get("tab") || "all" // all, pending, mentors, mentees, undefined
    const search = searchParams.get("search") || ""

    const from = (page - 1) * limit
    const to = from + limit - 1

    // 3. Query base
    let query = supabase
      .from("profiles")
      .select(`
        *,
        user_roles (
          roles (
            name
          )
        )
      `, { count: "exact" })

    // Filtros por aba
    if (tab === "pending") {
      // Aguardando: Mentores pendentes de verificação
      query = query.filter("user_roles.roles.name", "eq", "mentor").eq("verified", false)
    } else if (tab === "mentors") {
      // Mentores: Qualquer um com role mentor
      query = query.filter("user_roles.roles.name", "eq", "mentor")
    } else if (tab === "mentees") {
      // Mentees: Qualquer um com role mentee
      query = query.filter("user_roles.roles.name", "eq", "mentee")
    } else if (tab === "undefined") {
      // Não Definidos: Usuários sem nenhuma role atribuída
      query = query.is("user_roles", null)
    }

    // Filtro de busca
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: profiles, error: profilesError, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to)

    if (profilesError) throw profilesError

    // 4. Buscar contagens para as abas de forma eficiente
    const { count: totalCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })

    const { count: pendingCount } = await supabase
      .from("profiles")
      .select("user_roles!inner(roles!inner(name))", { count: "exact", head: true })
      .eq("verified", false)
      .eq("user_roles.roles.name", "mentor")

    const { count: mentorsCount } = await supabase
      .from("profiles")
      .select("user_roles!inner(roles!inner(name))", { count: "exact", head: true })
      .eq("user_roles.roles.name", "mentor")

    const { count: menteesCount } = await supabase
      .from("profiles")
      .select("user_roles!inner(roles!inner(name))", { count: "exact", head: true })
      .eq("user_roles.roles.name", "mentee")

    const { count: undefinedCount } = await supabase
      .from("profiles")
      .select("user_roles", { count: "exact", head: true })
      .is("user_roles", null)

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
        mentees: menteesCount || 0,
        undefined: undefinedCount || 0
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
