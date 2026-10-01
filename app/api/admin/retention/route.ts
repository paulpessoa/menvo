import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { requireAdmin } from "@/lib/auth/require-admin"

export async function GET() {
  try {
    const guard = await requireAdmin(["admin"])
    if (!guard.ok) return guard.response

    const supabase = createServiceRoleClient()

    // Buscamos a fila atual inteira, junto com os perfis
    const { data: queue, error } = await supabase
      .from("account_retention")
      .select(`
        *,
        profile:profiles!inner(
          email,
          full_name,
          email_opt_out_at
        )
      `)
      .order("clock_started_at", { ascending: true })

    if (error) throw error

    // Agrupamos os números para o card de resumo
    const stats = {
      enrolled: 0,
      noticed30d: 0,
      noticed1d: 0,
      optedOut: 0
    }

    for (const row of queue) {
      const isOptedOut = !!(row.profile as any).email_opt_out_at
      if (isOptedOut) {
        stats.optedOut++
      } else if (row.notice_1d_sent_at) {
        stats.noticed1d++
      } else if (row.notice_30d_sent_at) {
        stats.noticed30d++
      } else {
        stats.enrolled++
      }
    }

    return NextResponse.json({
      success: true,
      stats,
      queue
    })
  } catch (error: any) {
    console.error("[GET /api/admin/retention] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
