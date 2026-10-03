/**
 * Camada 6 · Port (e-mail de resultado do quiz)
 * Regra: o que o service precisa para avisar a pessoa, sem saber de Brevo.
 * Não faz: montar HTML (isso é do adapter/`lib/email`).
 * Tradeoff: uma interface a mais para testar o service sem rede e para trocar
 * de provedor de e-mail mexendo só em `adapters/quiz-mailer.brevo.ts`.
 */
export interface QuizResultsEmail {
  email: string
  name: string
  title: string
  summary: string
  resultUrl: string
  isAuthenticated: boolean
}

export interface QuizResultsMailer {
  send(message: QuizResultsEmail): Promise<{ success: boolean; error?: string }>
}
