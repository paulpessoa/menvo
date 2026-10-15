"use client"

import { useState } from "react"
import { CheckinQuestion } from "@/components/appointments/CheckinQuestion"
import { answerMyCheckinAction } from "@/app/actions/session-checkin"
import type { CheckinOutcome } from "@/lib/schemas/session-checkin"
import type { PendingCheckin } from "@/lib/services/appointments/checkin-responses.service"

interface PendingCheckinPromptProps {
  pending: PendingCheckin
  /** Chamado depois de responder; o modal recarrega e libera os horários. */
  onAnswered: () => void
}

/**
 * Bloqueio de agendamento (docs/domains/session-checkin.md §4): antes de
 * marcar outra mentoria, o mentorado diz se a anterior aconteceu. Só a
 * pergunta de 1 clique é obrigatória; avaliar continua opcional.
 */
export function PendingCheckinPrompt({ pending, onAnswered }: PendingCheckinPromptProps) {
  const [answering, setAnswering] = useState<CheckinOutcome | null>(null)
  const [error, setError] = useState("")

  async function handleAnswer(outcome: CheckinOutcome) {
    setAnswering(outcome)
    setError("")
    const result = await answerMyCheckinAction(pending.appointmentId, outcome)
    setAnswering(null)
    if (result.ok) onAnswered()
    else setError("Não conseguimos registrar sua resposta. Tente de novo.")
  }

  return (
    <div className="mx-auto max-w-sm space-y-4 py-8">
      <p className="text-center text-sm text-muted-foreground">
        Antes de marcar uma nova mentoria, conta pra gente como foi a anterior.
      </p>
      <CheckinQuestion
        otherFirstName={pending.mentorName.split(" ")[0]}
        scheduledAt={pending.scheduledAt}
        pending={answering}
        onAnswer={handleAnswer}
      />
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
    </div>
  )
}
