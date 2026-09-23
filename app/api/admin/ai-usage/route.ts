import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { getAiUsageReport } from "@/lib/services/ai/ai-usage.service"

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)

/** Monthly AI cost report (`?month=YYYY-MM`, defaults to the current month). */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const raw = request.nextUrl.searchParams.get("month") ?? new Date().toISOString().slice(0, 7)
  const month = monthSchema.safeParse(raw)
  if (!month.success) return NextResponse.json({ error: "month deve ser YYYY-MM" }, { status: 400 })

  try {
    const supabase = await createClient()
    return NextResponse.json(await getAiUsageReport(supabase, `${month.data}-01`))
  } catch (error) {
    console.error("[AdminAIUsage] error:", error)
    return NextResponse.json({ error: "Erro ao carregar uso de IA" }, { status: 500 })
  }
}
