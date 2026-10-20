/**
 * Camada 7 · Erro de regra do painel admin
 * Regra: o admin não pode se tirar do painel por engano (apagar a própria
 * conta ou retirar o próprio papel `admin`): sem outro admin ninguém volta a
 * entrar. O service lança, a rota traduz em 400 com {@link adminSelfActionResponse}.
 * Não faz: decidir quando a regra vale (cada service compara o ator ao alvo).
 */
import { NextResponse } from "next/server"

export class AdminSelfActionError extends Error {
  readonly status = 400
  readonly code = "SELF_ACTION_FORBIDDEN"

  constructor(message: string) {
    super(message)
    this.name = "AdminSelfActionError"
  }
}

/** @returns o 400 para {@link AdminSelfActionError}, ou `null` para qualquer outro erro. */
export function adminSelfActionResponse(error: unknown): NextResponse | null {
  if (!(error instanceof AdminSelfActionError)) return null
  return NextResponse.json({ error: error.message }, { status: error.status })
}
