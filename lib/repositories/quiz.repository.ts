/**
 * Camada 5 · Repository (quiz)
 * Regra: único ponto que fala com o banco para `quiz_responses` e para as RPCs
 * do quiz. Recebe o client por parâmetro: o do usuário (RLS) para o fluxo
 * normal, ou o `service_role` só nos métodos marcados "admin" (ADR 0007).
 * Não faz: regra de negócio (camada 7) nem criar client (impede teste e
 * esconde qual permissão está em uso).
 * Tradeoff: uma interface a mais em troca de testar o service com um fake e de
 * trocar de Postgres mexendo só aqui. O jsonb `ai_analysis` é validado aqui
 * (mapper); linha com formato inválido vira `null` e é logada, em vez de
 * quebrar a tela com um cast.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import type { QuizAnalysis, QuizAnswers, QuizSummary } from "@/lib/domain/quiz/quiz.entity"
import { storedQuizAnalysisSchema } from "@/lib/schemas/quiz"
import { RepositoryError } from "./repository-error"

export type SubmissionStatus = "ok" | "ip_limit" | "email_limit" | "budget"

export type QuizInsert = Database["public"]["Tables"]["quiz_responses"]["Insert"]

export type ClaimResult = { claimed: false } | { claimed: true; answers: QuizAnswers }

export interface QuizResultRow {
  id: string
  processed_at: string | null
  ai_analysis: QuizAnalysis | null
}

/** Linha usada para montar o e-mail de resultado (admin). */
export interface QuizEmailRow {
  id: string
  name: string
  email: string
  user_id: string | null
  ai_analysis: QuizAnalysis | null
}

/** Linha usada para conferir o token e criar a conta (admin). */
export interface QuizAccountRow {
  id: string
  name: string
  email: string
  user_id: string | null
}

export interface QuizRepository {
  submissionStatus(input: { email: string; ip: string; isAuth: boolean }): Promise<SubmissionStatus>
  insert(row: QuizInsert): Promise<void>
  findLatestByEmail(email: string): Promise<QuizSummary | null>
  getResult(id: string): Promise<QuizResultRow | null>
  ownsQuiz(id: string): Promise<boolean>
  claimAnalysis(serverKey: string, id: string): Promise<ClaimResult>
  saveAnalysis(serverKey: string, id: string, analysis: unknown): Promise<void>
  // --- admin (service_role, ADR 0007) ---
  findForEmail(id: string): Promise<QuizEmailRow | null>
  markEmailSent(id: string): Promise<void>
  findForAccount(id: string): Promise<QuizAccountRow | null>
  linkUser(id: string, userId: string): Promise<void>
}

/** jsonb -> QuizAnalysis. Inválido vira null com aviso (ver tradeoff no cabeçalho). */
function toAnalysis(raw: unknown, quizId: string): QuizAnalysis | null {
  if (raw === null || raw === undefined) return null
  const parsed = storedQuizAnalysisSchema.safeParse(raw)
  if (parsed.success) return parsed.data
  console.error(`[quiz.repository] ai_analysis inválido na linha ${quizId}`)
  return null
}

const SUMMARY_COLUMNS =
  "id, name, email, score, processed_at, created_at, development_areas, career_moment, ai_analysis"

export function createQuizRepository(db: SupabaseClient<Database>): QuizRepository {
  return {
    async submissionStatus({ email, ip, isAuth }) {
      // Erro da RPC não bloqueia: a policy de insert aplica o mesmo limite
      // (migration 20261001000000); perguntar antes é só para dar uma mensagem útil.
      const { data } = await db.rpc("quiz_submission_status", {
        p_email: email,
        p_ip: ip,
        p_is_auth: isAuth,
      })
      return data === "ip_limit" || data === "email_limit" || data === "budget" ? data : "ok"
    },

    async insert(row) {
      const { error } = await db.from("quiz_responses").insert(row)
      if (error) throw new RepositoryError("quiz.insert", error)
    },

    async findLatestByEmail(email) {
      const { data, error } = await db
        .from("quiz_responses")
        .select(SUMMARY_COLUMNS)
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw new RepositoryError("quiz.findLatestByEmail", error)
      if (!data) return null
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        score: data.score,
        processed_at: data.processed_at,
        created_at: data.created_at,
        development_areas: data.development_areas || [],
        career_moment: data.career_moment,
        ai_analysis: toAnalysis(data.ai_analysis, data.id),
      }
    },

    async getResult(id) {
      const { data, error } = await db.rpc("get_quiz_result", { p_id: id })
      if (error) throw new RepositoryError("quiz.getResult", error)
      const row = Array.isArray(data) ? data[0] : data
      if (!row) return null
      return {
        id: row.id,
        processed_at: row.processed_at,
        ai_analysis: toAnalysis(row.ai_analysis, row.id),
      }
    },

    async ownsQuiz(id) {
      const { data } = await db.rpc("owns_quiz_response", { p_id: id })
      return data === true
    },

    async claimAnalysis(serverKey, id) {
      const { data, error } = await db.rpc("claim_quiz_analysis", { p_server_key: serverKey, p_id: id })
      if (error) throw new RepositoryError("quiz.claimAnalysis", error)
      const claim = Array.isArray(data) ? data[0] : data
      if (!claim?.claimed) return { claimed: false }
      return {
        claimed: true,
        answers: {
          name: claim.name ?? "",
          career_moment: claim.career_moment ?? "",
          mentorship_experience: claim.mentorship_experience ?? "",
          development_areas: claim.development_areas ?? [],
          current_challenge: claim.current_challenge ?? "",
          future_vision: claim.future_vision ?? "",
          share_knowledge: claim.share_knowledge ?? "",
          personal_life_help: claim.personal_life_help ?? "",
        },
      }
    },

    async saveAnalysis(serverKey, id, analysis) {
      const { error } = await db.rpc("save_quiz_analysis", {
        p_server_key: serverKey,
        p_id: id,
        p_analysis: analysis as never,
      })
      if (error) throw new RepositoryError("quiz.saveAnalysis", error)
    },

    async findForEmail(id) {
      const { data, error } = await db
        .from("quiz_responses")
        .select("id, name, email, ai_analysis, user_id")
        .eq("id", id)
        .maybeSingle()
      if (error || !data) return null
      return { ...data, ai_analysis: toAnalysis(data.ai_analysis, data.id) }
    },

    async markEmailSent(id) {
      const { error } = await db
        .from("quiz_responses")
        .update({ email_sent: true, email_sent_at: new Date().toISOString() })
        .eq("id", id)
      // O e-mail já saiu; falhar aqui não deve desfazer o envio.
      if (error) console.error("[quiz.repository] falha ao marcar e-mail enviado:", error.message)
    },

    async findForAccount(id) {
      const { data } = await db
        .from("quiz_responses")
        .select("id, name, email, user_id")
        .eq("id", id)
        .maybeSingle()
      return data ?? null
    },

    async linkUser(id, userId) {
      // `is null`: um replay não troca o dono de uma linha já vinculada.
      const { error } = await db
        .from("quiz_responses")
        .update({ user_id: userId })
        .eq("id", id)
        .is("user_id", null)
      if (error) console.error("[quiz.repository] falha ao vincular a conta:", error.message)
    },
  }
}
