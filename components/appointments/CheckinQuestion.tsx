"use client"

import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CheckinOutcome } from "@/lib/schemas/session-checkin"

const OPTIONS: { value: CheckinOutcome; label: string }[] = [
  { value: "happened", label: "Sim, aconteceu" },
  { value: "not_happened", label: "Não rolou" },
  { value: "rescheduled", label: "Remarcamos" }
]

interface CheckinQuestionProps {
  otherFirstName: string
  scheduledAt: string
  /** Opção vinda do botão clicado no e-mail; aparece como a principal. */
  preselected?: CheckinOutcome | null
  /** Resposta em andamento (mostra o spinner nesse botão). */
  pending: CheckinOutcome | null
  onAnswer: (outcome: CheckinOutcome) => void
}

/**
 * Pergunta "a mentoria aconteceu?" com as três respostas, usada na página
 * /checkin/[token] e no bloqueio de agendamento. Um clique responde.
 */
export function CheckinQuestion({ otherFirstName, scheduledAt, preselected, pending, onAnswer }: CheckinQuestionProps) {
  const when = new Date(scheduledAt).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  })
  const primary = preselected ?? "happened"

  return (
    <div className="space-y-4 text-center">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-gray-900">A mentoria aconteceu?</h2>
        <p className="text-sm text-muted-foreground">
          Sua sessão com <strong>{otherFirstName || "a outra pessoa"}</strong> em {when}.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {OPTIONS.map(option => (
          <Button
            key={option.value}
            variant={option.value === primary ? "default" : "outline"}
            disabled={pending !== null}
            onClick={() => onAnswer(option.value)}
            className="w-full"
          >
            {pending === option.value && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
