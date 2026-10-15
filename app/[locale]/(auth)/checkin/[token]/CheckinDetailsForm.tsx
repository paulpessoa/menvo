"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { submitCheckinDetailsAction } from "@/app/actions/session-checkin"
import { checkinDetailsSchema, type CheckinDetails } from "@/lib/schemas/session-checkin"

interface CheckinDetailsFormProps {
  token: string
  role: "mentor" | "mentee"
  otherFirstName: string
  onSent: () => void
}

/**
 * Detalhes opcionais depois do "aconteceu". Mentorado: nota (obrigatória
 * para enviar), comentário público e o próximo passo, que vira a base do
 * follow-up de 30 dias. Mentor: uma nota privada sobre o mentorado.
 */
export function CheckinDetailsForm({ token, role, otherFirstName, onSent }: CheckinDetailsFormProps) {
  const [serverError, setServerError] = useState("")
  const isMentee = role === "mentee"
  const form = useForm<CheckinDetails>({
    resolver: zodResolver(
      isMentee
        ? checkinDetailsSchema.refine(v => v.rating !== null, { message: "Escolha uma nota", path: ["rating"] })
        : checkinDetailsSchema
    ),
    defaultValues: { rating: null, publicFeedback: "", privateNote: "", nextStep: "" }
  })
  const rating = form.watch("rating")

  async function onSubmit(values: CheckinDetails) {
    setServerError("")
    const result = await submitCheckinDetailsAction(token, values)
    if (result.ok) onSent()
    else setServerError("Não conseguimos enviar agora. Tente de novo em instantes.")
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 border-t pt-6">
      {isMentee ? (
        <>
          <div className="space-y-2">
            <Label>Como foi a conversa com {otherFirstName}?</Label>
            <div className="flex justify-center gap-1" role="radiogroup" aria-label="Nota de 1 a 5">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} de 5`}
                  onClick={() => form.setValue("rating", n, { shouldValidate: true })}
                  className="p-1"
                >
                  <Star className={`h-8 w-8 ${rating !== null && n <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                </button>
              ))}
            </div>
            {form.formState.errors.rating && (
              <p className="text-center text-sm text-red-600">{form.formState.errors.rating.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="nextStep">Qual vai ser seu próximo passo?</Label>
            <Textarea id="nextStep" rows={2} placeholder="Ex.: atualizar meu currículo até sexta" {...form.register("nextStep")} />
            <p className="text-xs text-muted-foreground">Fica só com você e a equipe. Daqui a um mês a gente pergunta como foi.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="publicFeedback">Quer deixar um depoimento para {otherFirstName}? (opcional)</Label>
            <Textarea id="publicFeedback" rows={3} {...form.register("publicFeedback")} />
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="privateNote">Como você viu {otherFirstName}? (opcional, privado)</Label>
          <Textarea id="privateNote" rows={3} {...form.register("privateNote")} />
        </div>
      )}

      {serverError && <p className="text-center text-sm text-red-600">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Enviar
      </Button>
    </form>
  )
}
