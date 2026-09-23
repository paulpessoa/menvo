import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { aiFeatureSchema } from "@/lib/ai/features"
import { getAiQuota } from "@/lib/ai/quota"

/**
 * Remaining monthly AI credits for the logged-in user, so the UI can say
 * "7 de 10 buscas" before the user clicks, instead of only after a 429.
 */
export async function GET(request: NextRequest) {
  const feature = aiFeatureSchema.safeParse(request.nextUrl.searchParams.get("feature"))
  if (!feature.success) {
    return NextResponse.json({ error: "feature inválida" }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    return NextResponse.json({ quota: await getAiQuota(supabase, feature.data) })
  } catch (error) {
    console.error("[AIQuotaRoute] error:", error)
    return NextResponse.json({ error: "Cota indisponível" }, { status: 503 })
  }
}
