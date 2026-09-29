"use client"

import { MenvoDots } from "@/components/ui/menvo-loader"
import { Button } from "@/components/ui/button"
import {  Send , Loader2 } from "lucide-react"

interface InvitePreviewStepProps {
  loading: boolean
  html: string | null
  onSendTest: () => void
  sendingTest: boolean
  eligibleCount: number
}

/**
 * Passo 3 do modal de convite: pré-visualização exata do HTML que será
 * enviado (mesma função `buildReengagementInviteHtml` usada no envio
 * real - ver app/api/admin/invites/preview) e um botão para mandar um
 * teste para o próprio admin antes de confirmar o envio em massa.
 */
export function InvitePreviewStep({ loading, html, onSendTest, sendingTest, eligibleCount }: InvitePreviewStepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Pré-visualização do e-mail que será enviado para <strong>{eligibleCount}</strong> pessoa(s).
        </p>
        <Button size="sm" variant="outline" onClick={onSendTest} disabled={sendingTest} className="gap-2">
          {sendingTest ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-3.5 w-3.5" />}
          Enviar teste para mim
        </Button>
      </div>
      <div className="rounded-lg border overflow-hidden bg-white" style={{ height: 480 }}>
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
            <MenvoDots /> Gerando pré-visualização...
          </div>
        ) : (
          <iframe title="Pré-visualização do e-mail" srcDoc={html || ""} className="w-full h-full border-0" />
        )}
      </div>
    </div>
  )
}
