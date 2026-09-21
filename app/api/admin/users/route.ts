import { createClient } from "@/lib/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import {
  errorResponse,
  handleApiError,
  successResponse
} from "@/lib/api/error-handler"
import { requireAdmin } from "@/lib/auth/require-admin"

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin(["admin", "moderator"])
    if (!guard.ok) return guard.response

    const supabase = await createClient()

    // 2. Buscar parâmetros de paginação e filtro
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const tab = searchParams.get("tab") || "all" // all, pending, mentors, mentees, undefined
    const search = searchParams.get("search") || ""
    const origin = searchParams.get("origin") || "" // "menvo" | "jotform" | "" (all)

    const from = (page - 1) * limit
    const to = from + limit - 1

    // 3. Query base - Definimos o select dependendo da aba para forçar o filtro
    let selectStr = `
      *,
      user_roles (
        roles (
          name
        )
      )
    `

    // Se for uma aba de role específica, usamos !inner para filtrar o nível superior (Profiles)
    if (["pending", "mentors", "mentees"].includes(tab)) {
      selectStr = `
        *,
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

    // Filtros por aba
    if (tab === "pending") {
      query = query.eq("user_roles.roles.name", "mentor").eq("verified", false)
    } else if (tab === "mentors") {
      query = query.eq("user_roles.roles.name", "mentor")
    } else if (tab === "mentees") {
      query = query.eq("user_roles.roles.name", "mentee")
    } else if (tab === "undefined") {
      query = query.is("user_roles", null)
    }

    // Filtro de busca
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Filtro de origem (cadastro direto no site vs. base migrada do JotForm)
    if (origin === "menvo" || origin === "jotform") {
      query = query.eq("origin_platform", origin)
    }

    const { data: profiles, error: profilesError, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to)

    if (profilesError) throw profilesError

    // 3b. Sinalizar quem também está na lista de espera (waiting_list) —
    // cruzamento por e-mail, só para os usuários desta página.
    const emails = (profiles ?? [])
      .map((p: any) => p.email)
      .filter((email: unknown): email is string => typeof email === "string" && email.length > 0)

    let waitingListEmails = new Set<string>()
    if (emails.length > 0) {
      const { data: waitingListRows } = await supabase
        .from("waiting_list")
        .select("email")
        .in("email", emails)

      waitingListEmails = new Set(
        (waitingListRows ?? []).map((row: any) => (row.email as string).toLowerCase())
      )
    }

    const profilesWithWaitingListFlag = (profiles ?? []).map((p: any) => ({
      ...p,
      in_waiting_list: typeof p.email === "string" && waitingListEmails.has(p.email.toLowerCase())
    }))

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

    const { count: menvoOriginCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("origin_platform", "menvo")

    const { count: jotformOriginCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("origin_platform", "jotform")

    // Mesmo filtro da aba: quem já entrou na plataforma não conta como
    // "esperando" (ver sync_waiting_list_status).
    const { count: waitingListCount } = await supabase
      .from("waiting_list")
      .select("*", { count: "exact", head: true })
      .neq("status", "registered")

    return successResponse({
      users: profilesWithWaitingListFlag,
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
        undefined: undefinedCount || 0,
        menvoOrigin: menvoOriginCount || 0,
        jotformOrigin: jotformOriginCount || 0,
        waitingList: waitingListCount || 0
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
