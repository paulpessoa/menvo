import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = req.nextUrl
  const search = searchParams.get("search") || ""
  const skills = searchParams.getAll("skills")
  const languages = searchParams.getAll("languages")
  const city = searchParams.get("city")
  const country = searchParams.get("country")
  const availability = searchParams.get("availability")
  const organizationId = searchParams.get("organization_id")
  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = parseInt(searchParams.get("limit") || "12", 10)

  // Get current user for visibility filtering
  const {
    data: { user }
  } = await supabase.auth.getUser()
  const userId = user?.id || null

  // Get visible mentor IDs based on visibility settings
  let visibleMentorIds: string[] | null = null
  if (userId || organizationId) {
    const { data: visibleIds } = await supabase.rpc("get_visible_mentor_ids", {
      p_user_id: userId,
      p_organization_id: organizationId
    })
    visibleMentorIds = visibleIds || []
  }

  let query = supabase
    .from("mentors_view")
    .select("*", { count: "exact" })
    .contains("active_roles", ["mentor"])
    .not("mentor_skills", "is", null)

  // Apply visibility filter
  if (visibleMentorIds !== null) {
    query = query.in("id", visibleMentorIds)
  }

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,` +
        `last_name.ilike.%${search}%,` +
        `bio.ilike.%${search}%,` +
        `current_position.ilike.%${search}%,` +
        `current_company.ilike.%${search}%,` +
        `mentor_skills.cs.{${search}}`
    )
  }
  if (skills.length > 0) {
    query = query.overlaps("mentor_skills", skills)
  }
  if (languages.length > 0) {
    query = query.overlaps("languages", languages)
  }
  if (city) {
    query = query.ilike("location", `%${city}%`)
  }
  if (country) {
    query = query.ilike("location", `%${country}%`)
  }
  if (availability && availability !== "all") {
    query = query.eq("availability", availability)
  }

  // Paginação
  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)
  query = query.order("first_name", { ascending: true })

  const { data, error, count } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({
    mentors: data || [],
    totalCount: count || 0,
    currentPage: page,
    totalPages: Math.ceil((count || 0) / limit),
    hasNextPage: page < Math.ceil((count || 0) / limit),
    hasPreviousPage: page > 1
  })
}
