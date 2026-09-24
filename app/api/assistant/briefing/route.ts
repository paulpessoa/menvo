import { NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { getUserBriefing } from "@/lib/ai-menvo/copilot/briefing"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const briefing = await getUserBriefing(supabase, user)
    return NextResponse.json({ briefing })
  } catch (error: any) {
    console.error("[Assistant Briefing Route Error]:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
