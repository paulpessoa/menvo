import type { SupabaseClient } from "@supabase/supabase-js"
import { getModel, AiModelUnavailableError } from "@/lib/ai/models"
import type { AiCallRecord } from "@/lib/ai/metering"

export interface FollowupOptions {
  onCall: (record: AiCallRecord) => void
}

/**
 * Determines whether a text response needs a clarifying follow-up.
 * Deterministic fast-path: if answer is already detailed (> 30 chars), skip LLM call.
 */
export function isAnswerTooVague(answer: string): boolean {
  const trimmed = answer.trim()
  if (trimmed.length < 15) return true
  const vagueTriggers = ["não sei", "nao sei", "sei la", "sei lá", "pouca coisa", "qualquer coisa", "tanto faz"]
  return vagueTriggers.some((t) => trimmed.toLowerCase().includes(t))
}

/**
 * Generates a concise follow-up question (max 1 sentence) using the model registry `followup` capability.
 */
export async function generateFollowupQuestion(
  supabase: SupabaseClient,
  stepQuestion: string,
  userAnswer: string,
  opts: FollowupOptions
): Promise<string> {
  try {
    const model = await getModel(supabase, "followup", { onCall: opts.onCall })

    const response = await model.invoke([
      {
        role: "system",
        content: `Você é um facilitador de diagnóstico profissional empático da Menvo.
O usuário recebeu a pergunta: "${stepQuestion}"
A resposta dele foi curta ou vaga: "${userAnswer}"
Gere uma ÚNICA pergunta curta, encorajadora e direta (máximo 1 frase, até 25 palavras) para ajudá-lo a detalhar ou dar um exemplo prático.
REGRAS:
- Nunca use emojis.
- Não faça saudações.
- Seja objetivo e vá direto à pergunta.`
      },
      {
        role: "user",
        content: userAnswer
      }
    ])

    const text = response.content.toString().trim()
    return text || "Você poderia me dar um exemplo prático ou detalhar um pouco mais o que tem em mente?"
  } catch (error) {
    if (!(error instanceof AiModelUnavailableError)) {
      console.warn("[Followup] Error generating followup question, using fallback:", error)
    }
    return "Você poderia detalhar um pouco mais ou dar um exemplo do que você mais busca desenvolver?"
  }
}
