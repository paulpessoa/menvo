/**
 * Camada 3 · Entity (appointments · status)
 * Regra: única definição de quais transições de `appointments.status` existem e
 * quem pode fazê-las. TypeScript puro, sem Supabase, React nem Next.
 * Não faz: ler o agendamento, descobrir quem é o ator (é o service, camada 7) nem
 * gravar. O banco terá a mesma tabela em SQL, como última barreira.
 * Tradeoff: a tabela aparece duas vezes (aqui e no trigger do banco). Em troca,
 * o service devolve uma mensagem clara antes de ir ao banco e o banco continua
 * protegido contra qualquer caminho que não passe pelo service (PostgREST direto,
 * cron, função SQL). Um teste por par mantém as duas honestas.
 */

/**
 * Estados que o banco aceita (CHECK em `appointments.status`). `rejected` existia
 * no tipo da UI, mas o CHECK não o aceita e nenhuma linha o tem; `expired` é só
 * rótulo de tela (o cron grava `cancelled`). Ver docs/blueprint/appointments-audit.md.
 */
export const APPOINTMENT_STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number]

/**
 * Quem pede a transição. `system` é o que não tem usuário por trás: cron de
 * expiração, resposta de check-in por token, funções `security definer`.
 */
export const TRANSITION_ACTORS = ["mentor", "mentee", "admin", "system"] as const

export type TransitionActor = (typeof TRANSITION_ACTORS)[number]

/**
 * De → para → quem pode. Cada linha existe porque algum fluxo vivo a faz:
 * - pending → confirmed: mentor confirma (botão ou link do e-mail).
 * - pending → cancelled: mentor recusa, mentorado desiste, admin cancela, cron expira.
 * - confirmed → completed: mentor conclui, mentorado avalia, check-in (system).
 * - confirmed → cancelled: qualquer lado cancela, admin, check-in "não rolou" (system).
 * - completed → cancelled: só o no-show do mentor (e o admin). O mentorado não
 *   desfaz uma sessão que já foi dada como concluída.
 * `cancelled` e `completed → confirmed|pending` não têm saída: `cancelled` é terminal.
 */
export const APPOINTMENT_TRANSITIONS: Readonly<
  Record<AppointmentStatus, Readonly<Partial<Record<AppointmentStatus, readonly TransitionActor[]>>>>
> = {
  pending: {
    confirmed: ["mentor"],
    cancelled: ["mentor", "mentee", "admin", "system"],
  },
  confirmed: {
    completed: ["mentor", "mentee", "system"],
    cancelled: ["mentor", "mentee", "admin", "system"],
  },
  completed: {
    cancelled: ["mentor", "admin"],
  },
  cancelled: {},
}

export type TransitionErrorCode = "INVALID_TRANSITION" | "TRANSITION_FORBIDDEN"

/** Erro tipado: o service o converte em 409 (par impossível) ou 403 (ator errado). */
export class InvalidTransitionError extends Error {
  constructor(
    public readonly code: TransitionErrorCode,
    public readonly from: AppointmentStatus,
    public readonly to: AppointmentStatus,
    public readonly actor: TransitionActor
  ) {
    super(
      code === "INVALID_TRANSITION"
        ? `Transição de status inválida: ${from} -> ${to}`
        : `${actor} não pode mudar o status de ${from} para ${to}`
    )
    this.name = "InvalidTransitionError"
  }
}

/** Type guard para valor vindo de fora do tipo (coluna `text` do banco, query string). */
export function isAppointmentStatus(value: unknown): value is AppointmentStatus {
  return typeof value === "string" && (APPOINTMENT_STATUSES as readonly string[]).includes(value)
}

/** Atores permitidos para o par; lista vazia quando o par não existe. */
export function allowedActors(from: AppointmentStatus, to: AppointmentStatus): readonly TransitionActor[] {
  return APPOINTMENT_TRANSITIONS[from][to] ?? []
}

/** Estados para os quais `actor` pode levar uma sessão que está em `from`. */
export function nextStatuses(from: AppointmentStatus, actor: TransitionActor): AppointmentStatus[] {
  return APPOINTMENT_STATUSES.filter((to) => allowedActors(from, to).includes(actor))
}

/** `cancelled` não tem saída: nenhum estado depois dele. */
export function isTerminal(status: AppointmentStatus): boolean {
  return Object.keys(APPOINTMENT_TRANSITIONS[status]).length === 0
}

/**
 * `from === to` conta como permitido: não é uma transição, é repetir o estado
 * (reenviar o clique de "concluir", por exemplo). Quem precisa recusar a repetição
 * usa o update condicional por status no repository, que a detecta.
 */
export function canTransition(from: AppointmentStatus, to: AppointmentStatus, actor: TransitionActor): boolean {
  if (from === to) return true
  return allowedActors(from, to).includes(actor)
}

/** Lança `InvalidTransitionError`: `INVALID_TRANSITION` se o par não existe, `TRANSITION_FORBIDDEN` se o ator não pode. */
export function assertTransition(from: AppointmentStatus, to: AppointmentStatus, actor: TransitionActor): void {
  if (from === to) return
  const actors = allowedActors(from, to)
  if (actors.length === 0) throw new InvalidTransitionError("INVALID_TRANSITION", from, to, actor)
  if (!actors.includes(actor)) throw new InvalidTransitionError("TRANSITION_FORBIDDEN", from, to, actor)
}
