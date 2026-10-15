"use client"

import { useState } from "react"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckinQuestion } from "@/components/appointments/CheckinQuestion"
import { answerCheckinAction } from "@/app/actions/session-checkin"
import type { CheckinOutcome, CheckinSummary } from "@/lib/schemas/session-checkin"
import { CheckinDetailsForm } from "./CheckinDetailsForm"

interface CheckinClientProps {
  token: string
  summary: CheckinSummary
  preselected: CheckinOutcome | null
}

const THANKS: Record<CheckinOutcome, string> = {
  happened: "Que bom! Obrigado por contar.",
  not_happened: "Poxa, obrigado por avisar. Isso ajuda a gente a cuidar melhor das próximas mentorias.",
  rescheduled: "Combinado, obrigado por avisar."
}

/**
 * Fluxo da página de check-in: pergunta (se ainda não respondida), depois o
 * agradecimento e, para quem disse "aconteceu", os detalhes opcionais.
 */
export function CheckinClient({ token, summary: initial, preselected }: CheckinClientProps) {
  const [summary, setSummary] = useState(initial)
  const [pending, setPending] = useState<CheckinOutcome | null>(null)
  const [detailsSent, setDetailsSent] = useState(false)
  const [error, setError] = useState("")

  async function handleAnswer(outcome: CheckinOutcome) {
    setPending(outcome)
    setError("")
    const result = await answerCheckinAction(token, outcome)
    setPending(null)
    if (result.ok) setSummary(result.data)
    else setError("Não conseguimos registrar sua resposta. Tente de novo em instantes.")
  }

  const isMentee = summary.role === "mentee"

  return (
    <Card className="w-full">
      <CardContent className="space-y-6 p-6">
        {summary.outcome === null ? (
          <CheckinQuestion
            otherFirstName={summary.other_first_name}
            scheduledAt={summary.scheduled_at}
            preselected={preselected}
            pending={pending}
            onAnswer={handleAnswer}
          />
        ) : (
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-bold text-gray-900">{THANKS[summary.outcome]}</h2>
            {summary.outcome === "rescheduled" && isMentee && summary.mentor_slug && (
              <Button asChild className="mt-2 w-full">
                <Link href={`/mentors/${summary.mentor_slug}`}>
                  Escolher novo horário com {summary.other_first_name}
                </Link>
              </Button>
            )}
          </div>
        )}

        {error && <p className="text-center text-sm text-red-600">{error}</p>}

        {summary.can_add_details && !detailsSent && (
          <CheckinDetailsForm
            token={token}
            role={summary.role}
            otherFirstName={summary.other_first_name}
            onSent={() => setDetailsSent(true)}
          />
        )}

        {detailsSent && (
          <p className="text-center text-sm text-muted-foreground">
            Recebido! {isMentee ? "Sua avaliação passa por uma revisão rápida antes de aparecer no perfil." : "Sua nota fica só com você e a equipe."}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
