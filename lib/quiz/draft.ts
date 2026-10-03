import { z } from "zod"
import { quizFormDataSchema } from "@/lib/schemas/quiz"
import { clearDraft } from "@/hooks/usePersistentDraft"

/**
 * Rascunho do formulário do quiz (camada 10). Guarda só as RESPOSTAS e a etapa.
 * Nome, e-mail e LinkedIn ficam de fora de propósito: são dados de contato, o
 * último passo pede de novo e a conta logada já preenche. Suba `QUIZ_DRAFT_VERSION`
 * ao mudar o formato ou as perguntas: rascunhos antigos são descartados.
 */
export const QUIZ_DRAFT_KEY = "menvo:quiz-draft"
export const QUIZ_DRAFT_VERSION = 1

export const quizDraftSchema = z.object({
  currentStep: z.number().int().min(1).max(8),
  answers: quizFormDataSchema.partial().omit({ name: true, email: true, linkedinUrl: true }),
})
export type QuizDraft = z.infer<typeof quizDraftSchema>

/** Rascunho sem nada preenchido não vale a pena guardar. */
export function isEmptyQuizDraft(draft: QuizDraft): boolean {
  return draft.currentStep === 1 && Object.values(draft.answers).every((v) => v === undefined || v === "" || (Array.isArray(v) && v.length === 0))
}

export const clearQuizDraft = () => clearDraft(QUIZ_DRAFT_KEY)
