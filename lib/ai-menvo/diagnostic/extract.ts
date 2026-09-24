import type { SupabaseClient } from "@supabase/supabase-js"
import { getStructuredModel, AiModelUnavailableError } from "@/lib/ai/models"
import type { AiCallRecord } from "@/lib/ai/metering"
import {
  extractCareerMomentSchema,
  extractDevelopmentAreasSchema,
  type DiagnosticSlotValues
} from "./types"

export interface ExtractOptions {
  onCall: (record: AiCallRecord) => void
}

/**
 * Extracts structured career moment from free text when user types instead of clicking chips.
 */
export async function extractCareerMoment(
  supabase: SupabaseClient,
  userInput: string,
  opts: ExtractOptions
): Promise<string> {
  try {
    const model = await getStructuredModel(
      supabase,
      "extract",
      extractCareerMomentSchema,
      { onCall: opts.onCall }
    )

    const result = await model.invoke([
      {
        role: "system",
        content: `Você é um extrator de dados de diagnóstico profissional.
Classifique a mensagem do usuário em uma das seguintes opções:
- 'ensino-medio': estudante ou concluinte do ensino médio
- 'estudante-universitario': cursando faculdade/graduação
- 'recem-formado': concluiu faculdade nos últimos 1-2 anos
- 'profissional-junior': início de carreira profissional no mercado
- 'transicao': mudando de área ou carreira
- 'outro': qualquer outra situação não coberta acima.
Atribua confiança de 0 a 1.`
      },
      {
        role: "user",
        content: userInput
      }
    ])

    if (result.confidence >= 0.7) {
      return result.value
    }
    return "outro"
  } catch (error) {
    if (!(error instanceof AiModelUnavailableError)) {
      console.warn("[Extract] Fallback to 'outro' on extract error:", error)
    }
    return "outro"
  }
}

/**
 * Extracts development areas from free text when user types instead of clicking chips.
 */
export async function extractDevelopmentAreas(
  supabase: SupabaseClient,
  userInput: string,
  opts: ExtractOptions
): Promise<{ areas: string[]; other?: string }> {
  try {
    const model = await getStructuredModel(
      supabase,
      "extract",
      extractDevelopmentAreasSchema,
      { onCall: opts.onCall }
    )

    const result = await model.invoke([
      {
        role: "system",
        content: `Você é um extrator de áreas de mentoria profissional.
Identifique quais das seguintes áreas se aplicam ao texto do usuário:
- 'Desenvolvimento técnico'
- 'Comunicação e networking'
- 'Liderança e gestão'
- 'Planejamento de carreira'
- 'Empreendedorismo'
- 'Equilíbrio vida pessoal/profissional'
Se houver tópicos específicos não contemplados pelas categorias acima, adicione no campo 'other'.`
      },
      {
        role: "user",
        content: userInput
      }
    ])

    return {
      areas: result.areas.length > 0 ? result.areas : ["Planejamento de carreira"],
      other: result.other
    }
  } catch (error) {
    if (!(error instanceof AiModelUnavailableError)) {
      console.warn("[Extract] Fallback to default area on extract error:", error)
    }
    return { areas: ["Planejamento de carreira"], other: userInput.slice(0, 100) }
  }
}

/**
 * Checks for crisis / acute psychological distress triggers (LGPD & safeguarding per AI_PLATFORM_PLAN §12.2).
 */
export function checkCrisisTrigger(text: string): boolean {
  if (!text) return false
  const lower = text.toLowerCase()
  const crisisKeywords = [
    "suicid",
    "me matar",
    "tirar minha vida",
    "acabar com tudo",
    "não quero mais viver",
    "desespero extremo",
    "vontade de sumir de vez"
  ]
  return crisisKeywords.some((keyword) => lower.includes(keyword))
}

export const CRISIS_SAFEGUARD_MESSAGE =
  "Percebemos que você pode estar passando por um momento muito difícil. " +
  "A mentoria da Menvo tem foco em orientação profissional e não substitui apoio emocional ou psicológico. " +
  "Por favor, procure acolhimento imediato com o CVV (Centro de Valorização da Vida) pelo telefone 188 (ligação gratuita 24h) ou pelo site cvv.org.br. Você não está sozinho(a)."
