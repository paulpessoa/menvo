import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { communityService } from "@/lib/services/community/community.service"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_roles(roles(name))")
      .eq("id", user.id)
      .maybeSingle()

    const roleNames = ((profile as any)?.user_roles || []).map((ur: any) => ur.roles?.name).filter(Boolean)
    const isMentor = roleNames.includes("mentor")
    const isAdmin = roleNames.includes("admin")

    if (!isMentor && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const page = Math.max(0, parseInt(searchParams.get("page") || "0", 10) || 0)
    const limit = Math.min(48, Math.max(1, parseInt(searchParams.get("limit") || "12", 10) || 12))
    const country = searchParams.get("country") || undefined
    const state = searchParams.get("state") || undefined
    const city = searchParams.get("city") || undefined
    const topics = searchParams.getAll("topics[]")
    const sortBy = (searchParams.get("sortBy") as "newest" | "name") || "newest"

    // The request-scoped client carries the mentor's session, which the
    // profiles RLS policy needs in order to return mentee rows.
    const result = await communityService.getCommunityProfiles(supabase, {
      search,
      page,
      limit,
      country,
      state,
      city,
      topics: topics.length > 0 ? topics : undefined,
      sortBy,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[Community API Error]:", error)
    return NextResponse.json(
      { error: "Failed to fetch community profiles" },
      { status: 500 }
    )
  }
}
