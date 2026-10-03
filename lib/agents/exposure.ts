/**
 * Camada 14 · Exposição para agentes
 * Regra: negar por padrão. Uma capability só chega a uma superfície se estiver
 * listada em `allow`, o `effect` não passar de `maxEffect` e o papel do ator
 * estiver na `audience` dela. Mudar este arquivo é decisão de produto e de
 * segurança: o PR precisa dizer por quê (e o snapshot em `exposure.test.ts`
 * mostra o diff).
 * Tradeoff: `allow` aceita `dominio.*` para não listar uma a uma, mas o teste
 * de snapshot lista os nomes resolvidos para o glob nunca liberar algo em silêncio.
 */
import {
  EFFECT_RANK,
  type Actor,
  type AnyCapability,
  type Effect,
  type Surface
} from "./define"
import { capabilities } from "./registry"

export interface SurfacePolicy {
  /** Quem pode estar do outro lado: `anonymous` = sem login. */
  audience: "anonymous" | "authenticated"
  maxEffect: Effect
  /** Nomes exatos (`mentors.search`) ou prefixo com glob (`mentors.*`). */
  allow: readonly string[]
}

export const exposure: Record<Surface, SurfacePolicy> = {
  // MCP público: qualquer cliente MCP na internet, sem login. Só leitura.
  mcp: {
    audience: "anonymous",
    maxEffect: "read",
    allow: ["mentors.search", "mentors.availability", "platform.explain"]
  },
  // Assistente dentro do app: usuário logado, filtrado por papel (audience da
  // capability). Mesmo conjunto de tools que o agent.ts antigo montava.
  assistant: {
    audience: "authenticated",
    maxEffect: "write",
    allow: [
      "mentors.*",
      "platform.*",
      "kb.search",
      "feedback.save",
      "appointments.*"
    ]
  },
  // Function calling de servidor (jobs, admin copilot). Nada liberado ainda.
  server: {
    audience: "authenticated",
    maxEffect: "write",
    allow: []
  }
}

function isAllowed(name: string, allow: readonly string[]): boolean {
  return allow.some((p) => (p.endsWith(".*") ? name.startsWith(p.slice(0, -1)) : p === name))
}

function audienceMatches(capability: AnyCapability, actor: Actor | null): boolean {
  if (capability.audience.includes("anonymous")) return true
  if (!actor) return false
  return capability.audience.includes("authenticated") || capability.audience.includes(actor.role)
}

/**
 * Capabilities que `actor` pode usar em `surface`, passando pelos três filtros.
 * Em superfície `anonymous`, o ator é ignorado: nunca se confia em identidade lá.
 */
export function capabilitiesFor(surface: Surface, actor: Actor | null): AnyCapability[] {
  const policy = exposure[surface]
  const effectiveActor = policy.audience === "anonymous" ? null : actor
  return capabilities.filter(
    (c) =>
      isAllowed(c.name, policy.allow) &&
      EFFECT_RANK[c.effect] <= EFFECT_RANK[policy.maxEffect] &&
      audienceMatches(c, effectiveActor)
  )
}
