/**
 * Camada 14 · Execução de capability (com auditoria)
 * Regra: único caminho por onde os adapters chamam um handler. Escrita feita
 * por agente deixa uma linha em `agent_audit_log` (ator, superfície, capability,
 * resultado), sem o input, por minimização de dados.
 * Não faz: autorização (exposure.ts) nem regra de negócio.
 * Tradeoff: o log é "melhor esforço": se o insert falhar, a ação segue e o erro
 * vai para o console. Bloquear a ação por falha de auditoria pioraria a
 * experiência sem proteger o usuário; a falha é visível nos logs do servidor.
 */
import type { AnyCapability, CapabilityContext } from "./define"

async function recordAudit(
  capability: AnyCapability,
  ctx: CapabilityContext,
  outcome: "ok" | "error"
): Promise<void> {
  // Sem ator não há linha possível: a policy exige actor_id = auth.uid().
  if (!ctx.actor) return
  try {
    // Tabela nova ainda fora de lib/types/supabase.ts; `from` aceita string.
    const { error } = await ctx.supabase.from("agent_audit_log").insert({
      actor_id: ctx.actor.id,
      surface: ctx.surface,
      capability: capability.name,
      effect: capability.effect,
      outcome
    })
    if (error) console.error("[agents] falha ao gravar auditoria:", error.message)
  } catch (err) {
    console.error("[agents] falha ao gravar auditoria:", err)
  }
}

export async function runCapability(
  capability: AnyCapability,
  input: unknown,
  ctx: CapabilityContext
): Promise<unknown> {
  if (capability.effect === "read") return capability.handler(input, ctx)

  try {
    const output = await capability.handler(input, ctx)
    await recordAudit(capability, ctx, "ok")
    return output
  } catch (err) {
    await recordAudit(capability, ctx, "error")
    throw err
  }
}
