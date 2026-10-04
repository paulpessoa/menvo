import type { ActivityLog } from "./activity-logs.types"

export const TABLE_LABELS: Record<string, string> = {
  profiles: "Perfil",
  mentor_profiles: "Perfil de mentor",
  mentee_profiles: "Perfil de mentorado",
  mentor_availability: "Disponibilidade",
  user_roles: "Papéis",
  appointments: "Sessões"
}

const OPERATION_LABELS: Record<ActivityLog["operation"], string> = {
  INSERT: "Criou",
  UPDATE: "Atualizou",
  DELETE: "Removeu"
}

const FIELD_LABELS: Record<string, string> = {
  is_public: "perfil público",
  first_name: "nome",
  last_name: "sobrenome",
  bio: "bio",
  avatar_url: "foto",
  job_title: "cargo",
  company: "empresa",
  expertise_areas: "áreas de atuação",
  mentorship_topics: "temas de mentoria",
  availability_status: "status de disponibilidade",
  verification_status: "status de verificação",
  mentorship_approach: "abordagem",
  what_to_expect: "o que esperar",
  status: "status",
  scheduled_at: "data da sessão",
  cancellation_reason: "motivo do cancelamento",
  role: "papel",
  community_ready: "comunidade"
}

/** Human field name; falls back to the raw column so nothing is hidden. */
export function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/_/g, " ")
}

/** Compact display for a changed value (arrays/objects/null included). */
export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "vazio"
  if (typeof value === "string") return value.length > 60 ? `${value.slice(0, 60)}…` : value
  if (typeof value === "object") return JSON.stringify(value).slice(0, 60)
  return String(value)
}

/** One-line action label, e.g. "Atualizou · Perfil". */
export function describeAction(log: ActivityLog): string {
  return `${OPERATION_LABELS[log.operation]} · ${TABLE_LABELS[log.table_name] ?? log.table_name}`
}

/** Field-level change lines for the "O que mudou" column. */
export function describeChanges(log: ActivityLog): string[] {
  return Object.entries(log.changes).map(([key, value]) => {
    const isDiff =
      log.operation === "UPDATE" && typeof value === "object" && value !== null && "new" in value
    if (isDiff) {
      const diff = value as { old: unknown; new: unknown }
      return `${fieldLabel(key)}: ${formatValue(diff.old)} → ${formatValue(diff.new)}`
    }
    return `${fieldLabel(key)}: ${formatValue(value)}`
  })
}
