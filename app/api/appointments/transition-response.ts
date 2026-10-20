import { NextResponse } from "next/server"
import type { TransitionBlock } from "@/lib/services/appointments/appointments.service"

/**
 * Camada 8 · resposta HTTP de uma transição de status que não aconteceu.
 * Regra: as duas recusas (outra pessoa mudou antes / banco ou entity recusou o
 * par) são 409, o status de "conflito com o estado atual". O `code` deixa o
 * cliente distinguir sem ler a mensagem. A mensagem do banco não sai daqui:
 * o texto é fixo, o detalhe fica no log do service.
 */
export function transitionBlockedResponse(block: TransitionBlock): NextResponse {
  if (block.kind === "changed") {
    return NextResponse.json(
      { error: "O status do agendamento mudou. Atualize a página e tente de novo.", code: "status_changed" },
      { status: 409 }
    )
  }
  return NextResponse.json(
    { error: "Esta mudança de status não é permitida para o agendamento.", code: "invalid_transition" },
    { status: 409 }
  )
}
