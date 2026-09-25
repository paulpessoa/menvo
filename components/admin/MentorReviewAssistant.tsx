"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { MentorReviewDraftPanel, type MentorReviewDraft, type ReviewKind } from "./MentorReviewDraftPanel"

const TAB_LABEL: Record<ReviewKind, string> = {
  approve: "Aprovação",
  reject: "Pedir ajustes",
  announce: "Divulgação"
}

/**
 * AI-assisted drafting for a mentor application: an assessment (strengths,
 * gaps, recommendation) plus an editable message for approval, a request
 * for changes, or a LinkedIn announcement post. Never sends anything on
 * its own — approval/rejection still goes through the parent's handlers,
 * and "Divulgação" only copies the text to the clipboard.
 */
export function MentorReviewAssistant({
  userId,
  onApprove,
  onReject
}: {
  userId: string
  onApprove: (message: string) => Promise<void>
  onReject: (message: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<ReviewKind>("approve")
  const [instructions, setInstructions] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [drafts, setDrafts] = useState<Partial<Record<ReviewKind, MentorReviewDraft>>>({})

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/verifications/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, kind, instructions: instructions.trim() || undefined })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 429) throw new Error("Limite mensal de IA atingido.")
        if (res.status === 503) throw new Error("IA indisponível no momento. Tente novamente em instantes.")
        if (res.status === 404) throw new Error("Perfil não encontrado.")
        throw new Error(data.error || "Erro ao gerar rascunho")
      }
      setDrafts((prev) => ({ ...prev, [kind]: data.draft }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao gerar rascunho")
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (tab: ReviewKind) => {
    const draft = drafts[tab]
    if (!draft) return
    setSubmitting(true)
    try {
      await (tab === "approve" ? onApprove(draft.message) : onReject(draft.message))
      setOpen(false)
    } catch {
      // O toast de erro já é exibido pelo handler do pai.
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopy = async (tab: ReviewKind) => {
    const draft = drafts[tab]
    if (!draft) return
    await navigator.clipboard.writeText(draft.message)
    toast.success("Texto copiado.")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="h-4 w-4 mr-2" />
          Assistente IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assistente de IA para verificação</DialogTitle>
          <DialogDescription>
            Gera uma avaliação do perfil e um rascunho de texto. Você revisa e edita antes de enviar.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={kind} onValueChange={(value) => setKind(value as ReviewKind)}>
          <TabsList className="mb-2">
            <TabsTrigger value="approve">{TAB_LABEL.approve}</TabsTrigger>
            <TabsTrigger value="reject">{TAB_LABEL.reject}</TabsTrigger>
            <TabsTrigger value="announce">{TAB_LABEL.announce}</TabsTrigger>
          </TabsList>

          {(["approve", "reject", "announce"] as ReviewKind[]).map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              <div>
                <Label htmlFor={`instructions-${tab}`}>Orientação adicional (opcional)</Label>
                <Textarea
                  id={`instructions-${tab}`}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value.slice(0, 500))}
                  placeholder="Ex.: peça também para completar a bio"
                  className="mt-1 min-h-[60px]"
                />
              </div>

              <Button onClick={generate} disabled={loading} size="sm">
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Gerar
              </Button>

              {drafts[tab] && (
                <MentorReviewDraftPanel
                  tab={tab}
                  draft={drafts[tab]!}
                  onMessageChange={(value) =>
                    setDrafts((prev) => ({ ...prev, [tab]: { ...prev[tab]!, message: value } }))
                  }
                  onSend={() => handleSend(tab)}
                  onCopy={() => handleCopy(tab)}
                  submitting={submitting}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
