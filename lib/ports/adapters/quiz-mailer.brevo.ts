/**
 * Camada 6 · Adapter Brevo (e-mail de resultado do quiz)
 * Regra: implementa `QuizResultsMailer` com o layout compartilhado de
 * `lib/email/brevo.ts`. Import dinâmico: a rota que só recebe o formulário não
 * precisa carregar o módulo de e-mail.
 */
import type { QuizResultsMailer } from "../quiz-mailer"

export const brevoQuizMailer: QuizResultsMailer = {
  async send(message) {
    const { sendQuizResultsEmail } = await import("@/lib/email/brevo")
    return sendQuizResultsEmail(message)
  },
}
