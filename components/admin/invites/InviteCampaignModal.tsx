"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import { InviteAudienceStep } from "./InviteAudienceStep"
import { InviteMessageStep } from "./InviteMessageStep"
import { InvitePreviewStep } from "./InvitePreviewStep"
import { InviteSendStep } from "./InviteSendStep"
import {
  DEFAULT_BODY,
  DEFAULT_CAMPAIGN,
  DEFAULT_SUBJECT,
  type AudienceSkipped,
  type InviteAudience,
  type SendBatchResult
} from "./types"

const BATCH_SIZE = 25
type Step = "audience" | "message" | "preview" | "send"

interface InviteCampaignModalProps {
  isOpen: boolean
  onClose: () => void
  selectedUserIds: string[]
  onSent: () => void
}

/**
 * Convida (ou reenvia convite para) uma campanha de reengajamento —
 * fluxo completo em 4 passos: público, mensagem, pré-visualização e
 * envio. Ver docs/domains/reengagement-invites.md Fase 5.
 */
export function InviteCampaignModal({ isOpen, onClose, selectedUserIds, onSent }: InviteCampaignModalProps) {
  const { user } = useAuth()
  const [step, setStep] = useState<Step>("audience")

  const [audience, setAudience] = useState<InviteAudience>(selectedUserIds.length > 0 ? "selected" : "jotform_not_invited")
  const [campaign, setCampaign] = useState(DEFAULT_CAMPAIGN)
  const [resend, setResend] = useState(false)
  const [limit, setLimit] = useState<number | "">(150)
  const [subject, setSubject] = useState(DEFAULT_SUBJECT)
  const [body, setBody] = useState(DEFAULT_BODY)

  const [loadingCount, setLoadingCount] = useState(false)
  const [eligibleUserIds, setEligibleUserIds] = useState<string[]>([])
  const [skipped, setSkipped] = useState<AudienceSkipped | null>(null)

  const [loadingPreview, setLoadingPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [sendingTest, setSendingTest] = useState(false)

  const [sending, setSending] = useState(false)
  const [sendResults, setSendResults] = useState<SendBatchResult[]>([])
  const [sendDone, setSendDone] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setStep("audience")
    setAudience(selectedUserIds.length > 0 ? "selected" : "jotform_not_invited")
    setCampaign(DEFAULT_CAMPAIGN)
    setResend(false)
    setSubject(DEFAULT_SUBJECT)
    setBody(DEFAULT_BODY)
    setPreviewHtml(null)
    setSendResults([])
    setSendDone(false)
  }, [isOpen, selectedUserIds.length])

  useEffect(() => {
    if (!isOpen || step !== "audience" || !campaign.trim()) return
    let cancelled = false
    setLoadingCount(true)
    fetch("/api/admin/invites/audience", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audience, campaign, resend, userIds: audience === "selected" ? selectedUserIds : undefined })
    })
      .then(res => res.json())
      .then(data => {
        if (cancelled) return
        setEligibleUserIds(data.eligibleUserIds || [])
        setSkipped(data.skipped || null)
      })
      .catch(() => !cancelled && toast.error("Erro ao calcular público"))
      .finally(() => !cancelled && setLoadingCount(false))
    return () => { cancelled = true }
  }, [isOpen, step, audience, campaign, resend, selectedUserIds])

  const loadPreview = () => {
    setLoadingPreview(true)
    fetch("/api/admin/invites/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body })
    })
      .then(res => res.json())
      .then(data => setPreviewHtml(data.html || null))
      .catch(() => toast.error("Erro ao gerar pré-visualização"))
      .finally(() => setLoadingPreview(false))
  }

  const handleSendTest = async () => {
    if (!user?.id) return
    setSendingTest(true)
    try {
      const res = await fetch("/api/admin/invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign: `${campaign}__test`, subject: `[TESTE] ${subject}`, body, userIds: [user.id], resend: true })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Falha ao enviar teste")
      toast.success("E-mail de teste enviado para você")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar teste")
    } finally {
      setSendingTest(false)
    }
  }

  const handleSend = async () => {
    setStep("send")
    setSending(true)
    setSendResults([])
    setSendDone(false)

    const limitedEligibleUserIds = typeof limit === "number" ? eligibleUserIds.slice(0, limit) : eligibleUserIds;
    const batches: string[][] = []
    for (let i = 0; i < limitedEligibleUserIds.length; i += BATCH_SIZE) {
      batches.push(limitedEligibleUserIds.slice(i, i + BATCH_SIZE))
    }

    const allResults: SendBatchResult[] = []
    for (const batch of batches) {
      try {
        const res = await fetch("/api/admin/invites/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campaign, subject, body, userIds: batch, resend })
        })
        const data = await res.json()
        if (res.ok) {
          allResults.push(...data.results)
        } else {
          allResults.push(...batch.map(userId => ({ userId, success: false, error: data.error || "Falha no lote" })))
        }
      } catch {
        allResults.push(...batch.map(userId => ({ userId, success: false, error: "Falha de rede" })))
      }
      setSendResults([...allResults])
    }

    setSending(false)
    setSendDone(true)
    onSent()
  }

  const limitedEligibleUserIds = typeof limit === "number" ? eligibleUserIds.slice(0, limit) : eligibleUserIds;
  const eligibleCount = limitedEligibleUserIds.length

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && !sending && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Convidar para a Menvo</DialogTitle>
          <DialogDescription>Envie um convite de reengajamento com saída de LGPD (parar de receber / apagar dados).</DialogDescription>
        </DialogHeader>

        {step === "audience" && (
          <InviteAudienceStep
            audience={audience}
            onAudienceChange={setAudience}
            selectedCount={selectedUserIds.length}
            campaign={campaign}
            onCampaignChange={setCampaign}
            resend={resend}
            onResendChange={setResend}
            loadingCount={loadingCount}
            eligibleCount={eligibleCount}
            skipped={skipped}
            limit={limit}
            onLimitChange={setLimit}
          />
        )}

        {step === "message" && (
          <InviteMessageStep subject={subject} onSubjectChange={setSubject} body={body} onBodyChange={setBody} />
        )}

        {step === "preview" && (
          <InvitePreviewStep
            loading={loadingPreview}
            html={previewHtml}
            onSendTest={handleSendTest}
            sendingTest={sendingTest}
            eligibleCount={eligibleCount}
          />
        )}

        {step === "send" && (
          <InviteSendStep total={eligibleCount} sent={sendResults.length} results={sendResults} done={sendDone} />
        )}

        <DialogFooter className="gap-2">
          {step === "audience" && (
            <Button onClick={() => setStep("message")} disabled={eligibleCount === 0 || loadingCount}>Continuar</Button>
          )}
          {step === "message" && (
            <>
              <Button variant="outline" onClick={() => setStep("audience")}>Voltar</Button>
              <Button onClick={() => { setStep("preview"); loadPreview() }} disabled={!subject.trim() || !body.trim()}>
                Pré-visualizar
              </Button>
            </>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("message")}>Voltar</Button>
              <Button onClick={handleSend}>Enviar para {eligibleCount} pessoa(s)</Button>
            </>
          )}
          {step === "send" && (
            <Button onClick={onClose} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {sendDone ? "Fechar" : "Enviando..."}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
