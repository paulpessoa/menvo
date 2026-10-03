/**
 * Camada 14 · Confirmação de ação proposta por agente
 * Regra: executa uma capability de escrita só depois do clique do usuário.
 * Revalida tudo no servidor: a capability precisa estar liberada para esse
 * ator na superfície `assistant`, exigir confirmação e o input passar no Zod.
 * Não faz: autenticação (a rota já resolveu o ator) nem regra de negócio.
 * Tradeoff: sem token de proposta no servidor. O input volta do cliente, mas
 * o usuário já vê exatamente o que confirma e o handler roda com o RLS dele,
 * então forjar o corpo só permite ao usuário fazer o que já poderia fazer.
 * Guardar propostas em tabela daria idempotência, ao custo de uma migration.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Actor } from "./define"
import { capabilitiesFor } from "./exposure"
import { runCapability } from "./run"

export type ConfirmResult =
  | { ok: true; output: unknown }
  | { ok: false; status: 400 | 403 | 404; error: string }

export async function confirmCapability(
  supabase: SupabaseClient,
  actor: Actor,
  name: string,
  input: unknown
): Promise<ConfirmResult> {
  const capability = capabilitiesFor("assistant", actor).find((c) => c.name === name)
  if (!capability) return { ok: false, status: 404, error: "Ação não disponível" }
  if (capability.confirmation !== "user") {
    return { ok: false, status: 403, error: "Esta ação não passa por confirmação" }
  }

  const parsed = capability.input.safeParse(input)
  if (!parsed.success) return { ok: false, status: 400, error: "Dados inválidos" }

  const output = await runCapability(capability, parsed.data, { supabase, actor, surface: "assistant" })
  return { ok: true, output }
}
