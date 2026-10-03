/**
 * Camada 14 · Capabilities (feedback)
 * Regra: salvar a nota do usuário sobre o atendimento do assistente.
 * Não faz: avaliação de mentoria (isso é `appointments.evaluate`).
 */
import { defineCapability } from "../define"
import { saveFeedback, saveFeedbackInput } from "@/lib/services/assistant/tools"

export const saveFeedbackCapability = defineCapability({
  name: "feedback.save",
  toolName: "saveFeedback",
  title: "Salvar feedback",
  description:
    "Salva a nota de avaliação do usuário (1 a 5) e comentário sobre o atendimento no banco de dados",
  input: saveFeedbackInput,
  // A policy de `feedback` aceita insert anônimo (user_id nulo), como antes.
  audience: ["anonymous"],
  effect: "write",
  // Dívida: executa direto, como antes da migração (ver STATUS.md).
  confirmation: "none",
  handler: (input, ctx) => saveFeedback(ctx.supabase, input)
})
