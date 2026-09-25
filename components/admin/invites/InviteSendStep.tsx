"use client"

import { Progress } from "@/components/ui/progress"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import type { SendBatchResult } from "./types"

interface InviteSendStepProps {
  total: number
  sent: number
  results: SendBatchResult[]
  done: boolean
}

/**
 * Passo 4 do modal de convite: acompanha o envio em lotes de 25 (a
 * orquestração do loop vive em InviteCampaignModal — este componente só
 * renderiza o progresso que recebe).
 */
export function InviteSendStep({ total, sent, results, done }: InviteSendStepProps) {
  const failures = results.filter(r => !r.success)
  const percent = total > 0 ? Math.round((sent / total) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>{done ? "Envio concluído" : "Enviando..."}</span>
          <span className="text-muted-foreground">{sent} de {total}</span>
        </div>
        <Progress value={percent} />
      </div>

      {!done && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Não feche esta janela até o envio terminar.
        </div>
      )}

      {done && (
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          {results.length - failures.length} enviado(s) com sucesso
          {failures.length > 0 && <span className="text-red-600 ml-1">· {failures.length} falha(s)</span>}
        </div>
      )}

      {failures.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 max-h-40 overflow-y-auto space-y-1">
          {failures.map(f => (
            <div key={f.userId} className="flex items-start gap-2 text-xs text-red-800">
              <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{f.userId}: {f.error}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
