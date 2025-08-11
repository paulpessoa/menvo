import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * API Profile
 * - GET: retorna o perfil do usuário autenticado
 * - POST: cria o perfil (primeira vez) e, se role = mentor, abre uma validation_request "pending"
 * - PUT: atualiza o perfil do usuário autenticado
 *
 * Observação: Esta rota espera Authorization: Bearer <access_token> no header (Postman)
 * TODO: Remover logs após validar em produção.
 */

function getSupabaseForRequest(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
  }
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || ""
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(req)
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()
    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = No rows found
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile: data || null })
  } catch (e: any) {
    console.error("GET /api/profile error:", e)
    if (e?.message?.includes("Supabase env")) {
      return NextResponse.json({ error: "Server Misconfigured: " + e.message }, { status: 500 })
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { name, bio, role, avatar_url, location, skills, experience_level, linkedin_url, github_url, website_url } =
      body

    if (!name || !role) {
      return NextResponse.json({ error: "Missing required fields: name, role" }, { status: 400 })
    }

    if (role !== "mentor" && role !== "mentee" && role !== "admin") {
      return NextResponse.json({ error: "Invalid role. Use 'mentor' or 'mentee'." }, { status: 400 })
    }

    const supabase = getSupabaseForRequest(req)
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()
    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verifica se já existe profile
    const { data: existing } = await supabase
      .from("profiles")
      .select("id, role, is_validated")
      .eq("user_id", user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "Profile already exists" }, { status: 409 })
    }

    const { data, error } = await supabase
      .from("profiles")
      .insert([
        {
          user_id: user.id,
          name,
          bio,
          role,
          avatar_url: avatar_url || null,
          location: location || null,
          skills: Array.isArray(skills) ? skills : null,
          experience_level: experience_level || null,
          linkedin_url: linkedin_url || null,
          github_url: github_url || null,
          website_url: website_url || null,
          is_validated: false,
        },
      ])
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Se for mentor, abre uma validation_request pendente (o admin aprova depois)
    if (role === "mentor") {
      await supabase.from("validation_requests").insert([{ user_id: user.id, status: "pending" }])
      // Ignore erro de duplicidade silenciosamente
    }

    return NextResponse.json({ profile: data }, { status: 201 })
  } catch (e: any) {
    console.error("POST /api/profile error:", e)
    if (e?.message?.includes("Supabase env")) {
      return NextResponse.json({ error: "Server Misconfigured: " + e.message }, { status: 500 })
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { name, bio, role, avatar_url, location, skills, experience_level, linkedin_url, github_url, website_url } =
      body

    const supabase = getSupabaseForRequest(req)
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()
    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Bloqueia setar is_validated pelo cliente
    const updates: any = {
      ...(name !== undefined ? { name } : {}),
      ...(bio !== undefined ? { bio } : {}),
      ...(avatar_url !== undefined ? { avatar_url } : {}),
      ...(location !== undefined ? { location } : {}),
      ...(skills !== undefined ? { skills: Array.isArray(skills) ? skills : null } : {}),
      ...(experience_level !== undefined ? { experience_level } : {}),
      ...(linkedin_url !== undefined ? { linkedin_url } : {}),
      ...(github_url !== undefined ? { github_url } : {}),
      ...(website_url !== undefined ? { website_url } : {}),
    }

    // Permite mudar role (opcional). Se mudar para mentor, garante validation_request
    if (role) {
      if (role !== "mentor" && role !== "mentee" && role !== "admin") {
        return NextResponse.json({ error: "Invalid role. Use 'mentor' or 'mentee'." }, { status: 400 })
      }
      updates.role = role
    }

    const { data, error } = await supabase.from("profiles").update(updates).eq("user_id", user.id).select("*").single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (role === "mentor") {
      // Cria solicitação de validação se não existir uma pendente
      const { data: existingReq } = await supabase
        .from("validation_requests")
        .select("id, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!existingReq || existingReq.status !== "pending") {
        await supabase.from("validation_requests").insert([{ user_id: user.id, status: "pending" }])
      }
    }

    return NextResponse.json({ profile: data })
  } catch (e: any) {
    console.error("PUT /api/profile error:", e)
    if (e?.message?.includes("Supabase env")) {
      return NextResponse.json({ error: "Server Misconfigured: " + e.message }, { status: 500 })
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}
