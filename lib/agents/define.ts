/**
 * Camada 14 · Capabilities (define)
 * Regra: uma capability descreve UMA ação para agentes (nome, schema, quem
 * pode, que efeito tem) e delega a lógica a um service. Escrever a ação aqui
 * uma única vez evita o MCP e o assistente divergirem.
 * Não faz: decidir onde ela aparece (isso é `exposure.ts`) nem falar com o
 * banco por conta própria.
 * Tradeoff: `toolName` fica separado de `name` porque o nome "de fio"
 * (searchMentors) já é usado por clientes MCP, pelo system prompt e pelo SSE do
 * chat; renomear quebraria quem consome. `name` é o identificador estável e
 * namespaced usado em exposure e testes.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { z } from "zod"

/** Papéis que um ator pode ter (mesmos nomes de `roles.name`). */
export type AgentRole = "mentee" | "mentor" | "admin"

/**
 * Quem pode usar uma capability. `anonymous` = qualquer um, inclusive sem login;
 * `authenticated` = qualquer logado; os demais = papel específico.
 */
export type Audience = "anonymous" | "authenticated" | AgentRole

/** O que a ação faz com os dados. Usado por `exposure.maxEffect`. */
export type Effect = "read" | "write" | "destructive"

/** Ordem de gravidade, para comparar com `maxEffect`. */
export const EFFECT_RANK: Record<Effect, number> = { read: 0, write: 1, destructive: 2 }

export type Surface = "mcp" | "assistant" | "server"

/** Quem está chamando. `null` = anônimo (MCP público). */
export interface Actor {
  id: string
  role: AgentRole
}

/**
 * O que um handler recebe. Só o client com RLS do ator (ou anônimo): nunca
 * `service_role` (ADR 0005). Se uma ação precisa de mais permissão que o RLS
 * dá ao usuário, o problema é a policy, não o handler.
 */
export interface CapabilityContext {
  supabase: SupabaseClient
  actor: Actor | null
  surface: Surface
}

/**
 * Formatação opcional por superfície, para preservar o formato que cada uma
 * já devolvia antes da migração. Sem isso, o padrão é `JSON.stringify(output)`.
 */
export interface Presentation<Output> {
  /** MCP: valor que vira `JSON.stringify(v, null, 2)` no `content`. */
  mcp?: (output: Output) => unknown
  /**
   * Assistente (LangChain `content_and_artifact`): `content` vai para o LLM,
   * `artifact` NÃO é visto pelo modelo (ex.: cards de mentor para a UI).
   */
  assistant?: (output: Output) => { content: string; artifact: unknown }
}

export interface Capability<Input = unknown, Output = unknown> {
  /** Identificador estável, `dominio.acao`. Nunca renomeie. */
  name: string
  /** Nome da tool nos protocolos (MCP/LangChain). Nunca renomeie: é contrato externo. */
  toolName: string
  title: string
  /** Texto que o modelo lê para decidir quando chamar. */
  description: string
  input: z.ZodType<Input, z.ZodTypeDef, unknown>
  audience: readonly Audience[]
  effect: Effect
  /**
   * `user` = o agente só propõe e a UI pede confirmação humana (ainda não
   * implementado em nenhuma superfície); `none` = executa direto. Ver
   * `exposure.test.ts` para a dívida atual das escritas.
   */
  confirmation: "none" | "user"
  handler: (input: Input, ctx: CapabilityContext) => Promise<Output> | Output
  present?: Presentation<Output>
}

/**
 * Identidade tipada: força o handler a receber o tipo inferido do schema Zod
 * (adeus `input: any`) e devolve a capability sem o tipo de input exposto,
 * para caber em listas heterogêneas.
 */
export function defineCapability<Input, Output>(
  capability: Capability<Input, Output>
): AnyCapability {
  return capability as unknown as AnyCapability
}

/** Capability com tipos apagados, para guardar no registro. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyCapability = Capability<any, any>
