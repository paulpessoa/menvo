/**
 * Camada 7 · Service (quiz, servidor)
 * Regra: regras do quiz e permissão. Recebe repository e ports por parâmetro
 * (`QuizServiceDeps`), então roda em teste sem banco, sem IA e sem e-mail.
 * Não faz: HTTP (status, cookies, `after()`, rate limit por IP: camada 8) nem
 * falar com o banco (camada 5).
 * Tradeoff: cada operação devolve uma união (`kind`) em vez de lançar, para a
 * rota mapear para status sem `try/catch` por regra. O client `service_role`
 * nunca chega aqui: só `adminRepo` e `accounts`, criados de forma preguiçosa
 * em `quiz.composition.ts` (ADR 0007).
 */
import type { AiCallRecord } from "@/lib/ai/metering"
import type { AnalysisMentor } from "@/lib/ai-menvo/diagnostic/analyze"
import type { QuizAnalysis, QuizAnswers, QuizResultView, QuizSummary } from "@/lib/domain/quiz/quiz.entity"
import { needsRetake } from "@/lib/domain/quiz/quiz.entity"
import { buildResultUrl, verifyResultLink } from "@/lib/quiz/result-link"
import type { QuizSubmitInput } from "@/lib/schemas/quiz"
import type { AccountProvisioner } from "@/lib/ports/account-provisioner"
import type { QuizResultsMailer } from "@/lib/ports/quiz-mailer"
import type { AnalysisMentorSource } from "@/lib/repositories/analysis-mentors.repository"
import type { QuizRepository } from "@/lib/repositories/quiz.repository"

export interface QuizServiceDeps {
  /** Client do usuário (RLS). */
  repo: QuizRepository
  /** `service_role`, criado só quando usado (ADR 0007). */
  adminRepo: () => QuizRepository
  mentors: AnalysisMentorSource
  accounts: AccountProvisioner
  mailer: QuizResultsMailer
  analyze: (
    answers: QuizAnswers,
    mentors: AnalysisMentor[],
    opts: { onCall: (record: AiCallRecord) => void; isAuthenticated: boolean }
  ) => Promise<{ analysis: QuizAnalysis }>
  recordCalls: (calls: AiCallRecord[]) => Promise<void>
}

export type SubmitResult =
  | { kind: "created"; id: string }
  /** `limitCount` é quantas análises a pessoa tem direito em 30 dias (logada 2, anônima 1). */
  | { kind: "limit"; code: "ip_limit" | "email_limit"; limitCount: number }
  | { kind: "budget" }
  | { kind: "failed" }

export type AnalysisOutcome = { kind: "claim_failed" } | { kind: "not_claimed" } | { kind: "done" }

export type QuizEmailOutcome = "sent" | "not_found" | "not_ready" | "failed"

export type AccountOutcome =
  | { kind: "invalid_link" }
  | { kind: "exists"; email: string }
  | { kind: "password_rejected"; message: string }
  | { kind: "failed" }
  | { kind: "created"; email: string }

export function createQuizService(deps: QuizServiceDeps) {
  const { repo, mentors, accounts, mailer } = deps

  /** Linha do quiz + prova de que o chamador tem o e-mail (token assinado). */
  async function loadVerifiedRow(id: string, token: string) {
    const admin = deps.adminRepo()
    const row = await admin.findForAccount(id)
    if (!row || !verifyResultLink(token, row.id, row.email)) return null
    return { admin, row }
  }

  async function sendResults(id: string): Promise<QuizEmailOutcome> {
    const row = await deps.adminRepo().findForEmail(id)
    if (!row) return "not_found"

    // "precisa_refazer" é um convite para responder de novo, não uma análise
    // que valha mandar por e-mail.
    if (!row.ai_analysis || needsRetake(row)) return "not_ready"

    const result = await mailer.send({
      email: row.email,
      name: row.name || "",
      title: row.ai_analysis.titulo_personalizado || "Sua análise de carreira",
      summary: row.ai_analysis.resumo_motivador || "",
      resultUrl: buildResultUrl(row.id, row.email),
      isAuthenticated: !!row.user_id,
    })

    if (!result.success) {
      console.error("[quiz-email] falha ao enviar:", result.error)
      return "failed"
    }

    await deps.adminRepo().markEmailSent(id)
    return "sent"
  }

  return {
    /**
     * Envia um novo quiz. A conta logada manda: o e-mail vem da sessão, nunca
     * do formulário (é o endereço que recebe o resultado e que o limite conta).
     */
    async submit(args: {
      input: QuizSubmitInput
      ip: string
      user: { id: string; email?: string | null } | null
    }): Promise<SubmitResult> {
      const { input, ip, user } = args
      const email = (user?.email ?? input.email).trim().toLowerCase()
      const isAuth = !!user?.id

      // Mesma checagem que a policy de insert aplica; perguntada antes só para
      // responder com uma mensagem que a pessoa consiga agir.
      const status = await repo.submissionStatus({ email, ip, isAuth })
      if (status === "ip_limit" || status === "email_limit") {
        return { kind: "limit", code: status, limitCount: isAuth ? 2 : 1 }
      }
      if (status === "budget") return { kind: "budget" }

      // O id nasce aqui, não de um `.select()` depois do insert: anônimo não
      // tem policy de SELECT, então o select falharia mesmo com o insert ok.
      const id = crypto.randomUUID()
      try {
        await repo.insert({
          id,
          user_id: user?.id ?? null,
          name: input.name,
          email,
          linkedin_url: input.linkedin_url || null,
          career_moment: input.career_moment,
          mentorship_experience: input.mentorship_experience,
          development_areas: input.development_areas,
          current_challenge: input.current_challenge,
          future_vision: input.future_vision,
          share_knowledge: input.share_knowledge,
          personal_life_help: input.personal_life_help,
          ip_address: ip,
        })
      } catch (error) {
        console.error("[quiz] Erro ao inserir resposta:", (error as Error).message)
        return { kind: "failed" }
      }
      return { kind: "created", id }
    },

    /** Visão pública do resultado; `is_owner` só se houver sessão (o link é público). */
    async getResult(id: string, viewerLoggedIn: boolean): Promise<QuizResultView | null> {
      const row = await repo.getResult(id)
      if (!row) return null
      const isOwner = viewerLoggedIn ? await repo.ownsQuiz(row.id) : false
      return { id: row.id, processed_at: row.processed_at, ai_analysis: row.ai_analysis, is_owner: isOwner }
    },

    getLatest(email: string): Promise<QuizSummary | null> {
      return repo.findLatestByEmail(email.trim().toLowerCase())
    },

    /**
     * Roda a análise uma única vez por quiz. A ordem importa e foi mantida:
     * claim atômico -> mentores -> IA -> salvar -> registrar uso -> e-mail. O
     * claim impede reprocessar (e cobrar IA de novo); o e-mail só sai se salvou.
     */
    async runAnalysis(args: { id: string; serverKey: string; isAuthenticated: boolean }): Promise<AnalysisOutcome> {
      let claim
      try {
        claim = await repo.claimAnalysis(args.serverKey, args.id)
      } catch (error) {
        console.error("[quiz/analyze] falha ao reivindicar análise:", (error as Error).message)
        return { kind: "claim_failed" }
      }

      // Já processado, reivindicado há menos de 2 min, ou orçamento de IA do mês
      // esgotado. A página de resultado faz polling de qualquer forma.
      if (!claim.claimed) return { kind: "not_claimed" }

      const calls: AiCallRecord[] = []
      const { analysis } = await deps.analyze(claim.answers, await mentors.list(), {
        onCall: (record) => calls.push(record),
        isAuthenticated: args.isAuthenticated,
      })

      let saved = true
      try {
        await repo.saveAnalysis(args.serverKey, args.id, analysis)
      } catch (error) {
        saved = false
        console.error("[quiz/analyze] falha ao salvar análise:", (error as Error).message)
      }

      await deps.recordCalls(calls)

      // O claim garante uma execução por análise: o e-mail sai uma vez, sem a
      // pessoa precisar pedir.
      if (saved) {
        await sendResults(args.id).catch((error) => {
          console.error("[quiz/analyze] falha ao enviar e-mail:", error)
        })
      }

      return { kind: "done" }
    },

    sendResults,

    /** O link do e-mail ainda serve para criar conta? Ou o e-mail já tem conta? */
    async checkAccountLink(id: string, token: string) {
      const verified = await loadVerifiedRow(id, token)
      if (!verified) return null
      const { row } = verified
      const exists = Boolean(row.user_id) || (await accounts.emailHasAccount(row.email))
      return { status: exists ? ("exists" as const) : ("claimable" as const), email: row.email }
    },

    /**
     * Cria a conta (já confirmada) a partir do quiz anônimo. Só acontece quando
     * a pessoa manda a senha: abrir o link sozinho nunca cria nada.
     */
    async createAccountFromResults(id: string, token: string, password: string): Promise<AccountOutcome> {
      const verified = await loadVerifiedRow(id, token)
      if (!verified) return { kind: "invalid_link" }
      const { admin, row } = verified

      if (row.user_id || (await accounts.emailHasAccount(row.email))) {
        return { kind: "exists", email: row.email }
      }

      const created = await accounts.createConfirmedAccount({ email: row.email, password, fullName: row.name || "" })
      if (created.kind === "exists") return { kind: "exists", email: row.email }
      if (created.kind === "password_rejected") return { kind: "password_rejected", message: created.message }
      if (created.kind === "failed") {
        console.error("[quiz/account] falha ao criar conta:", created.message)
        return { kind: "failed" }
      }

      await admin.linkUser(row.id, created.userId)
      return { kind: "created", email: row.email }
    },
  }
}

export type QuizService = ReturnType<typeof createQuizService>
