import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { sendWaitingListCompleteProfileRequest } from "@/lib/email/brevo"

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { waitingListId } = await request.json()
    if (!waitingListId) {
      return NextResponse.json({ error: "waitingListId é obrigatório" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: entry, error } = await supabase
      .from("waiting_list")
      .select("name, email")
      .eq("id", waitingListId)
      .single()

    if (error || !entry) {
      return NextResponse.json({ error: "Registro não encontrado na lista de espera" }, { status: 404 })
    }

    const result = await sendWaitingListCompleteProfileRequest({
      name: (entry as any).name,
      email: (entry as any).email
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Falha ao enviar e-mail" }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[API waiting-list/request-info] Erro:", error)
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}
