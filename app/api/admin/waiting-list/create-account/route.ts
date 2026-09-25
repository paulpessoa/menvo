import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { createAccountForWaitingListEntry } from "@/lib/services/waiting-list/create-account.service"

/**
 * Provisiona (ou reaproveita) uma conta Menvo para uma pessoa da lista de
 * espera e envia um convite com link de autenticação. Ao ser criada, a
 * conta já vira "mentee" por padrão via trigger do banco em auth.users —
 * ninguém aqui atribui role manualmente.
 *
 * A lógica de criação em si vive em
 * lib/services/waiting-list/create-account.service.ts (reaproveitada pelo
 * endpoint de criação em lote); ver o comentário lá sobre por que
 * `generateLink({type:'invite'})` é chamado sozinho, sem `admin.createUser()`
 * antes.
 */
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { waitingListId } = await request.json()
    if (!waitingListId) {
      return NextResponse.json({ error: "waitingListId é obrigatório" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: entry, error: entryError } = await supabase
      .from("waiting_list")
      .select("id, name, email, whatsapp, reason")
      .eq("id", waitingListId)
      .single()

    if (entryError || !entry) {
      return NextResponse.json({ error: "Registro não encontrado na lista de espera" }, { status: 404 })
    }

    const result = await createAccountForWaitingListEntry(entry as any)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, accountCreated: result.accountCreated })
  } catch (error: any) {
    console.error("[API waiting-list/create-account] Erro:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}
