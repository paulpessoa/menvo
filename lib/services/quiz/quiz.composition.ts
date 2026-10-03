/**
 * Camada 7 · Composição do service de quiz
 * Regra: o único lugar que escolhe as implementações reais (Supabase, Brevo,
 * modelo de IA) e entrega ao service. As rotas só chamam `buildQuizService`.
 * Não faz: regra de negócio (é do service).
 * Tradeoff: o client `service_role` e os módulos pesados (IA, e-mail) são
 * criados/importados só quando usados. O build roda sem segredos e a rota que
 * só recebe o formulário não carrega langchain nem Brevo.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { createQuizRepository } from "@/lib/repositories/quiz.repository"
import { createAnalysisMentorSource } from "@/lib/repositories/analysis-mentors.repository"
import { createSupabaseAccountProvisioner } from "@/lib/ports/adapters/account-provisioner.supabase"
import { brevoQuizMailer } from "@/lib/ports/adapters/quiz-mailer.brevo"
import { createQuizService } from "./quiz.server.service"

export function buildQuizService(supabase: SupabaseClient<Database>) {
  // Um client privilegiado por request, criado na primeira vez que alguém o pede.
  let admin: SupabaseClient | null = null
  const getAdmin = () => (admin ??= createServiceRoleClient())

  return createQuizService({
    repo: createQuizRepository(supabase),
    adminRepo: () => createQuizRepository(getAdmin() as SupabaseClient<Database>),
    mentors: createAnalysisMentorSource(supabase),
    accounts: createSupabaseAccountProvisioner(getAdmin),
    mailer: brevoQuizMailer,
    analyze: async (answers, mentors, opts) => {
      const { analyzeQuiz } = await import("@/lib/ai-menvo/diagnostic/analyze")
      return analyzeQuiz(supabase, answers, mentors, opts)
    },
    recordCalls: async (calls) => {
      const { recordAiCalls } = await import("@/lib/ai/metering")
      await recordAiCalls(supabase, "quiz_analysis", calls)
    },
  })
}
