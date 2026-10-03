import { z } from 'zod';
import type { QuizAnalysis, QuizResultView, QuizSummary } from '@/lib/domain/quiz/quiz.entity';

export const quizFormDataSchema = z.object({
  careerMoment: z.string().min(1, 'Selecione seu momento de carreira'),
  currentChallenge: z.string().trim().min(11, 'Descreva seu desafio com pelo menos 11 caracteres'),
  mentorshipExperience: z.string().min(1, 'Selecione sua experiência anterior'),
  futureVision: z.string().trim().min(11, 'Descreva sua visão com pelo menos 11 caracteres'),
  developmentAreas: z.array(z.string()).min(1, 'Selecione pelo menos uma área de desenvolvimento'),
  developmentAreasOther: z.string().optional(),
  personalLifeHelp: z.string().trim().min(11, 'Descreva com pelo menos 11 caracteres'),
  shareKnowledge: z.string().min(1, 'Selecione sua preferência de compartilhamento'),
  name: z.string().trim().min(2, 'Informe seu nome completo'),
  email: z.string().trim().email('Informe um email válido'),
  linkedinUrl: z.string().trim().optional().or(z.literal('')),
});

export type QuizFormData = z.infer<typeof quizFormDataSchema>;

/**
 * Server-side shape of a quiz submission (`POST /api/quiz`), snake_case to
 * match `quiz_responses` Insert columns. Client fields not listed here
 * (ai_analysis, processed_at, score, email_sent...) are never accepted from
 * the request body - the RLS insert policy also rejects them, this is just
 * the first line of defense.
 */
export const quizSubmitSchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(254),
  linkedin_url: z.string().trim().url().max(300).nullable().optional().or(z.literal('')),
  career_moment: z.string().trim().min(1).max(200),
  mentorship_experience: z.string().trim().min(1).max(200),
  development_areas: z.array(z.string().trim().min(1).max(120)).min(1).max(20),
  current_challenge: z.string().trim().min(11).max(4000),
  future_vision: z.string().trim().min(11).max(4000),
  share_knowledge: z.string().trim().min(1).max(200),
  personal_life_help: z.string().trim().min(11).max(4000),
});

/** Corpo aceito por `POST /api/quiz`; o cliente usa este mesmo tipo (sem interface duplicada). */
export type QuizSubmitInput = z.infer<typeof quizSubmitSchema>;

// ---------------------------------------------------------------------------
// Saída das rotas e params (camada 4). Tipos de DTO = z.infer, nunca à mão.
// Cada schema é checado contra a Entity (`satisfies`), então um campo novo na
// Entity que não esteja aqui falha no typecheck.
// ---------------------------------------------------------------------------

/** `id` de rota: UUID. Antes qualquer string chegava até o banco. */
export const quizIdParamSchema = z.object({ id: z.string().uuid() });

/**
 * `ai_analysis` como lido do banco. Mais frouxo que o `quizAnalysisSchema` de
 * `analyze.ts` (o que a IA deve devolver): aqui os opcionais existem porque
 * linhas antigas não os têm.
 */
export const storedQuizAnalysisSchema = z.object({
  precisa_refazer: z.boolean().optional(),
  titulo_personalizado: z.string(),
  resumo_motivador: z.string(),
  mentores_sugeridos: z.array(
    z.object({
      tipo: z.string(),
      razao: z.string(),
      disponivel: z.boolean(),
      mentor_nome: z.string().optional(),
    })
  ),
  conselhos_praticos: z.array(z.string()),
  proximos_passos: z.array(z.string()),
  areas_desenvolvimento: z.array(z.string()),
  mensagem_final: z.string(),
  potencial_mentor: z.boolean().optional(),
  areas_vida_pessoal: z.array(z.string()).optional(),
}) satisfies z.ZodType<QuizAnalysis>;

/** `GET /api/quiz/[id]`: a visão pública do resultado. */
export const quizResultViewSchema = z.object({
  id: z.string().uuid(),
  processed_at: z.string().nullable(),
  ai_analysis: storedQuizAnalysisSchema.nullable(),
  is_owner: z.boolean().optional(),
}) satisfies z.ZodType<QuizResultView>;

export const quizSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
  score: z.number().nullable(),
  processed_at: z.string().nullable(),
  created_at: z.string().nullable(),
  career_moment: z.string(),
  development_areas: z.array(z.string()),
  ai_analysis: storedQuizAnalysisSchema.nullable(),
}) satisfies z.ZodType<QuizSummary>;

/** `GET /api/quiz/latest`. */
export const quizLatestResponseSchema = z.object({ summary: quizSummarySchema.nullable() });

/** `POST /api/quiz`. */
export const quizSubmitResponseSchema = z.object({ id: z.string().uuid() });

/** `POST /api/quiz/[id]/account`: o `k` é o token assinado do link do e-mail. */
export const quizAccountBodySchema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.').max(72),
});

/** `GET /api/quiz/[id]/account?k=...`. */
export const quizAccountStatusSchema = z.object({
  status: z.enum(['claimable', 'exists']),
  email: z.string(),
});

/** `POST /api/quiz/[id]/account` (sucesso). */
export const quizAccountCreatedSchema = z.object({ ok: z.literal(true), email: z.string() });

export const stepValidation = {
  1: (data: Partial<QuizFormData>) => !!data.careerMoment,
  2: (data: Partial<QuizFormData>) => !!data.currentChallenge && data.currentChallenge.trim().length > 10,
  3: (data: Partial<QuizFormData>) => !!data.mentorshipExperience,
  4: (data: Partial<QuizFormData>) => !!data.futureVision && data.futureVision.trim().length > 10,
  5: (data: Partial<QuizFormData>) => Array.isArray(data.developmentAreas) && data.developmentAreas.length > 0,
  6: (data: Partial<QuizFormData>) => !!data.personalLifeHelp && data.personalLifeHelp.trim().length > 10,
  7: (data: Partial<QuizFormData>) => !!data.shareKnowledge,
  8: (data: Partial<QuizFormData>) => {
    const result = z.object({
      name: z.string().trim().min(2),
      email: z.string().trim().email(),
    }).safeParse(data);
    return result.success;
  },
};

/** `GET /api/quiz/[id]/account?k=...`: o token assinado vem na query. */
export const quizAccountLinkQuerySchema = z.object({ k: z.string().min(1) });

/** `POST /api/quiz/[id]/account` quando o e-mail já tem conta (409). */
export const quizAccountExistsSchema = z.object({ status: z.literal('exists'), email: z.string() });

/** `POST /api/quiz/[id]/analyze`: `claimed: false` não é erro (a página de resultado faz polling). */
export const quizAnalyzeResponseSchema = z.object({ ok: z.literal(true), claimed: z.boolean() });

/** `POST /api/quiz/[id]/send-email`. */
export const quizSendEmailResponseSchema = z.object({ ok: z.literal(true) });
