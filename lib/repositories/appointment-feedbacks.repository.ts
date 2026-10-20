/**
 * Camada 5 · Repository (avaliações de sessão)
 * Regra: único ponto que fala com `appointment_feedbacks` para o fluxo de
 * appointments (avaliar, listar, editar o comentário, apagar no no-show).
 * Recebe o client por parâmetro; quem monta decide a permissão.
 * Não faz: regra de negócio (quem pode avaliar, quantas vezes) nem moderação
 * (aprovar/rejeitar é do admin).
 * Tradeoff: fica separado de `appointments.repository` porque é outra tabela,
 * com outra RLS; unir os dois esconderia qual policy cada método depende.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database, TablesInsert } from "@/lib/types/supabase"
import { RepositoryError } from "./repository-error"

/** Nome e e-mail do outro lado da avaliação (embed de `profiles`). */
export interface FeedbackParty {
  full_name: string | null
  email: string | null
}

/** Avaliação como `GET /api/appointments/feedback` a devolve. Sem notas privadas. */
export interface FeedbackListItem {
  id: string
  rating: number | null
  public_feedback: string | null
  status: string | null
  created_at: string
  rejection_reason: string | null
  mentee: FeedbackParty | null
  mentor: FeedbackParty | null
}

export type NewFeedback = Pick<
  TablesInsert<"appointment_feedbacks">,
  "appointment_id" | "reviewer_id" | "reviewed_id" | "rating" | "private_notes" | "public_feedback"
>

export interface AppointmentFeedbacksRepository {
  /** Já existe avaliação deste avaliador para a sessão? Devolve o id, ou `null`. */
  findByReviewer(appointmentId: string, reviewerId: string): Promise<{ id: string } | null>
  findOwner(feedbackId: string): Promise<{ id: string; reviewer_id: string } | null>
  listForUser(input: { userId: string; type: "sent" | "received" }): Promise<FeedbackListItem[]>
  insert(row: NewFeedback): Promise<void>
  /** Troca o comentário público e devolve a avaliação para moderação (`pending`). */
  updatePublicFeedback(feedbackId: string, publicFeedback: string): Promise<void>
  /** Remove as avaliações da sessão (no-show: não faz sentido avaliar quem faltou). */
  deleteByAppointment(appointmentId: string): Promise<void>
}

const LIST_SELECT = `
  id, rating, public_feedback, status, created_at, rejection_reason,
  mentee:profiles!reviewer_id(full_name, email),
  mentor:profiles!reviewed_id(full_name, email)
`

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

export function createAppointmentFeedbacksRepository(
  db: SupabaseClient<Database>,
  now: () => Date = () => new Date()
): AppointmentFeedbacksRepository {
  return {
    async findByReviewer(appointmentId, reviewerId) {
      const { data, error } = await db
        .from("appointment_feedbacks")
        .select("id")
        .eq("appointment_id", appointmentId)
        .eq("reviewer_id", reviewerId)
        .maybeSingle()
      if (error) throw new RepositoryError("appointmentFeedbacks.findByReviewer", error)
      return data ?? null
    },

    async findOwner(feedbackId) {
      const { data, error } = await db
        .from("appointment_feedbacks")
        .select("id, reviewer_id")
        .eq("id", feedbackId)
        .maybeSingle()
      if (error) {
        // 22P02: id que não é UUID; para o app é "não encontrada", como a rota já tratava.
        if (error.code === "22P02") return null
        throw new RepositoryError("appointmentFeedbacks.findOwner", error)
      }
      return data ?? null
    },

    async listForUser({ userId, type }) {
      let query = db.from("appointment_feedbacks").select(LIST_SELECT).order("created_at", { ascending: false })
      query = type === "received" ? query.eq("reviewed_id", userId) : query.eq("reviewer_id", userId)
      const { data, error } = await query
      if (error) throw new RepositoryError("appointmentFeedbacks.listForUser", error)
      return (data ?? []).map((row) => ({
        ...row,
        mentee: one(row.mentee as FeedbackParty | FeedbackParty[] | null),
        mentor: one(row.mentor as FeedbackParty | FeedbackParty[] | null),
      }))
    },

    async insert(row) {
      const { error } = await db.from("appointment_feedbacks").insert(row)
      if (error) throw new RepositoryError("appointmentFeedbacks.insert", error)
    },

    async updatePublicFeedback(feedbackId, publicFeedback) {
      const { error } = await db
        .from("appointment_feedbacks")
        .update({ public_feedback: publicFeedback, status: "pending", updated_at: now().toISOString() })
        .eq("id", feedbackId)
      if (error) throw new RepositoryError("appointmentFeedbacks.updatePublicFeedback", error)
    },

    async deleteByAppointment(appointmentId) {
      const { error } = await db.from("appointment_feedbacks").delete().eq("appointment_id", appointmentId)
      if (error) throw new RepositoryError("appointmentFeedbacks.deleteByAppointment", error)
    },
  }
}
