import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { requireAdmin } from "@/lib/auth/require-admin"

/**
 * Isenta um usuário da fila de retenção LGPD (JotForm).
 * A isenção é feita mudando a origin_platform para 'menvo' (tratando-o
 * como um usuário normal que não está sujeito à exclusão de importados)
 * e removendo-o da tabela account_retention.
 */
export async function POST(request: Request) {
  try {
    const guard = await requireAdmin(["admin"])
    if (!guard.ok) return guard.response

    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // 1. Muda a origem para menvo
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ origin_platform: "menvo" })
      .eq("id", userId)

    if (updateError) throw updateError

    // 2. Remove da fila de retenção
    const { error: deleteError } = await supabase
      .from("account_retention")
      .delete()
      .eq("user_id", userId)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[POST /api/admin/retention/exempt] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
