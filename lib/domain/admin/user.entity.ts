/**
 * Camada 3 · Entity (usuário visto pelo painel admin)
 * Regra: os tipos do usuário como o admin o enxerga e edita, derivados do
 * banco e do schema Zod, sem interface escrita à mão. `AdminUserUpdate` vem do
 * mesmo schema que valida o PATCH, então o formulário e a rota não divergem.
 * Não faz: acesso a banco (camada 5) nem validação (camada 4).
 * Tradeoff: `AdminUserView` descreve o item JÁ achatado que a lista devolve
 * (campos de mentor e de mentorado no mesmo nível), porque é o formato que a
 * tela consome; o select é montado dinamicamente e o supabase-js não o infere.
 */
import type { z } from "zod"
import type { Tables } from "@/lib/types/supabase"
import type { adminUserUpdatesSchema } from "@/lib/schemas/admin-users"
import type { FlattenedMentorFields } from "@/lib/services/mentors/mentor-profile-fields"
import type { FlattenedMenteeFields } from "@/lib/services/mentees/mentee-profile-fields"

/** Papéis que o painel conhece hoje (D3: sem `moderator`). */
export type AdminAssignableRole = "mentee" | "mentor" | "admin"

/** Campos editáveis no modal de usuário (entrada do schema, antes das transformações). */
export type AdminUserUpdate = z.input<typeof adminUserUpdatesSchema>

type ProfileRow = Tables<"profiles">

/** Um usuário da lista do admin, no formato achatado que a API devolve. */
export type AdminUserView = Omit<
  ProfileRow,
  keyof FlattenedMentorFields | keyof FlattenedMenteeFields
> &
  FlattenedMentorFields &
  FlattenedMenteeFields & {
    user_roles: { roles: { name: string } | null }[]
    /** "menvo" para cadastro orgânico, "jotform" para a base importada. */
    origin_platform: string
    invite_sent_at: string | null
  }
