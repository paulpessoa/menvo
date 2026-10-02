import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"
import { requireAdmin } from "@/lib/auth/require-admin"

/** Profile row as returned by the list query: the select string is built dynamically, so supabase-js cannot infer it. */
type AdminProfileRow = Record<string, unknown> & {
  import_records: { origin_platform: string; invite_sent_at: string | null } | null
}

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin(["admin", "moderator"])
    if (!guard.ok) return guard.response

    const supabase = await createClient()

    // 2. Buscar parâmetros de paginação e filtro
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    
    const search = searchParams.get("search") || ""
    const origin = searchParams.get("origin") || "" // "menvo" | "jotform" | "" (all)
    const role = searchParams.get("role") || "" // "mentor" | "mentee" | ""
    const status = searchParams.get("status") || "" // "pending" | "verified" | ""
    const sortBy = searchParams.get("sort_by") || "created_at" // "created_at" | "full_name"
    const sortOrder = searchParams.get("sort_order") || "desc" // "asc" | "desc"

    const from = (page - 1) * limit
    const to = from + limit - 1

    // 3. Query base
    // Dados de importação vivem em import_records (1:1, só admin lê). Com
    // filtro de origem JotForm usamos !inner para filtrar o nível de profiles.
    const importEmbed = origin === "jotform" ? "import_records!inner (origin_platform, invite_sent_at)" : "import_records (origin_platform, invite_sent_at)"

    let selectStr = `
      *,
      ${importEmbed},
      user_roles (
        roles (
          name
        )
      )
    `

    // Se houver filtro de role, usamos !inner para filtrar o nível superior (Profiles)
    if (role === "mentor" || role === "mentee") {
      selectStr = `
        *,
        ${importEmbed},
        user_roles!inner (
          roles!inner (
            name
          )
        )
      `
    }

    let query = supabase
      .from("profiles")
      .select(selectStr, { count: "exact" })

    // Filtro por papel (role)
    if (role === "mentor") {
      query = query.eq("user_roles.roles.name", "mentor")
    } else if (role === "mentee") {
      query = query.eq("user_roles.roles.name", "mentee")
    }

    // Filtro por status
    if (status === "pending") {
      query = query.eq("verification_status", "pending")
    } else if (status === "verified") {
      query = query.eq("verified", true)
    }

    // Filtro de busca
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Filtro de origem
    // "jotform" = tem registro de importação com origem jotform;
    // "menvo" = nunca foi importado (sem registro).
    if (origin === "jotform") {
      query = query.eq("import_records.origin_platform", "jotform")
    } else if (origin === "menvo") {
      query = query.is("import_records", null)
    }

    // Ordenação
    const isAscending = sortOrder === "asc"
    if (sortBy === "full_name") {
      query = query.order("full_name", { ascending: isAscending })
    } else {
      query = query.order("created_at", { ascending: isAscending })
    }

    let paginatedQuery = query.range(from, to)
    
    let { data: profiles, error: profilesError, count } = await paginatedQuery

    if (profilesError) throw profilesError

    // 4. Buscar contagens para as abas de forma eficiente
    const { count: totalCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })

    const { count: pendingCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "pending")

    const { count: mentorsCount } = await supabase
      .from("profiles")
      .select("user_roles!inner(roles!inner(name))", { count: "exact", head: true })
      .eq("user_roles.roles.name", "mentor")

    const { count: menteesCount } = await supabase
      .from("profiles")
      .select("user_roles!inner(roles!inner(name))", { count: "exact", head: true })
      .eq("user_roles.roles.name", "mentee")



    const { count: menvoOriginCount } = await supabase
      .from("profiles")
      .select("id, import_records(user_id)", { count: "exact", head: true })
      .is("import_records", null)

    const { count: jotformOriginCount } = await supabase
      .from("import_records")
      .select("*", { count: "exact", head: true })
      .eq("origin_platform", "jotform")

    return successResponse({
      // Achata import_records para manter o formato que o painel já consome
      // (origin_platform e invite_sent_at no próprio usuário).
      users: ((profiles ?? []) as unknown as AdminProfileRow[]).map(({ import_records, ...profile }) => ({
        ...profile,
        origin_platform: import_records?.origin_platform ?? "menvo",
        invite_sent_at: import_records?.invite_sent_at ?? null
      })),
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

        menvoOrigin: menvoOriginCount || 0,
        jotformOrigin: jotformOriginCount || 0
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
