import { NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { createAccountForWaitingListEntry } from "@/lib/services/waiting-list/create-account.service"

/**
 * Processa em lote todos os registros da lista de espera que ainda não têm
 * conta criada, reaproveitando a mesma lógica do botão individual
 * "Criar Conta e Convidar". Roda sequencialmente (um de cada vez) e para na
 * primeira falha de envio de e-mail (failedStage === "email") — sinal de que
 * o limite diário do provedor (ex: 20 e-mails/dia no plano free do Brevo)
 * estourou, então não adianta continuar tentando os próximos. Uma falha só
 * na geração do link (failedStage === "link", ex: e-mail inválido) não para
 * o lote, só pula esse registro.
 */
export async function POST() {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const supabase = await createClient()

    const { error: syncError } = await supabase.rpc("sync_waiting_list_status")
    if (syncError) throw syncError

    const { data: entries, error: entriesError } = await supabase
      .from("waiting_list")
      .select("id, name, email, whatsapp, reason")
      .neq("status", "registered")
      .neq("status", "invited")
      .order("created_at", { ascending: true })
      .returns<any[]>()

    if (entriesError) throw entriesError

    const results: Array<{ id: string; email: string; success: boolean; accountCreated: boolean; error?: string; failedStage?: string }> = []
    let stoppedEarly = false

    for (const entry of entries ?? []) {
      try {
        const result = await createAccountForWaitingListEntry(entry)
        results.push({ id: entry.id, email: entry.email, ...result })
        if (!result.success && result.failedStage === "email") {
          stoppedEarly = true
          break
        }
      } catch (error: any) {
        results.push({
          id: entry.id,
          email: entry.email,
          success: false,
          accountCreated: false,
          error: error.message || "Erro desconhecido"
        })
      }
    }

    const created = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success)
    const remaining = (entries?.length ?? 0) - results.length

    return NextResponse.json({
      success: true,
      processed: results.length,
      created,
      failed: failed.length,
      errors: failed,
      stoppedEarly,
      remaining
    })
  } catch (error: any) {
    console.error("[API waiting-list/bulk-create-accounts] Erro:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}
