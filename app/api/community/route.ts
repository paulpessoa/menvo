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
    const page = parseInt(searchParams.get("page") || "0", 10)
    const limit = parseInt(searchParams.get("limit") || "12", 10)

    // Using the same service but wrapped in an API. 
    // This allows the server to query securely on behalf of authorized users.
    const result = await communityService.getCommunityProfiles({
      search,
      page,
      limit,
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
