import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"

/**
 * GET /api/mentors/lookup?names=Name+One,Name+Two - resolves AI-suggested
 * mentor names (from a quiz analysis) to their real profile slug/id, so
 * `/quiz/results/[id]` can link to an actual profile instead of a name
 * search. Used to be a direct `mentors_view` query from the browser
 * (docs/COMMUNITY_CONTACT_PLAN.md §13); public/anonymous by design, same as
 * the mentor directory itself, and reads only public columns.
 */
export async function GET(request: NextRequest) {
  const namesParam = request.nextUrl.searchParams.get("names") || ""
  const names = namesParam
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean)
    .slice(0, 20)

  if (names.length === 0) {
    return NextResponse.json({ mentors: [] })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("mentors_view")
    .select("id, full_name, slug")
    .in("full_name", names)

  if (error) {
    console.error("[GET /api/mentors/lookup] Erro ao buscar mentores:", error.message)
    return NextResponse.json({ mentors: [] })
  }

  return NextResponse.json({ mentors: data || [] })
}
