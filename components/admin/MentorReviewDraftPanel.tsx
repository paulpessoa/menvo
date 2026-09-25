"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Copy, Send } from "lucide-react"

export type ReviewKind = "approve" | "reject" | "announce"

export interface MentorReviewDraft {
  recommendation: "approve" | "request_changes" | "reject"
  summary: string
  strengths: string[]
  gaps: string[]
  message: string
}

const RECOMMENDATION_LABEL: Record<MentorReviewDraft["recommendation"], string> = {
  approve: "Recomenda aprovar",
  request_changes: "Recomenda pedir ajustes",
  reject: "Recomenda rejeitar"
}

/**
 * Renders one generated draft (assessment + editable message) and its
 * primary action: send for approve/reject tabs, copy-to-clipboard for
 * announce. Purely presentational — all state lives in the parent dialog.
 */
export function MentorReviewDraftPanel({
  tab,
  draft,
  onMessageChange,
  onSend,
  onCopy,
  submitting
}: {
  tab: ReviewKind
  draft: MentorReviewDraft
  onMessageChange: (value: string) => void
  onSend: () => void
  onCopy: () => void
  submitting: boolean
}) {
  return (
    <div className="space-y-4 border-t pt-4">
      <Badge variant="secondary">{RECOMMENDATION_LABEL[draft.recommendation]}</Badge>
      <p className="text-sm text-muted-foreground">{draft.summary}</p>

      {draft.strengths.length > 0 && (
        <div>
          <Label className="text-xs text-muted-foreground uppercase font-semibold">Pontos fortes</Label>
          <ul className="mt-1 text-sm list-disc list-inside space-y-0.5">
            {draft.strengths.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {draft.gaps.length > 0 && (
        <div>
          <Label className="text-xs text-muted-foreground uppercase font-semibold">Lacunas</Label>
          <ul className="mt-1 text-sm list-disc list-inside space-y-0.5">
            {draft.gaps.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <Label htmlFor={`message-${tab}`}>Texto</Label>
        <Textarea
          id={`message-${tab}`}
          value={draft.message}
          onChange={(e) => onMessageChange(e.target.value)}
          className="mt-1 min-h-[160px]"
        />
      </div>

      <div className="flex justify-end gap-2">
        {tab === "announce" ? (
          <Button variant="outline" size="sm" onClick={onCopy}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar texto
          </Button>
        ) : (
          <Button
            size="sm"
            variant={tab === "reject" ? "destructive" : "default"}
            className={tab === "approve" ? "bg-primary hover:bg-primary/90 text-white" : undefined}
            onClick={onSend}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            {tab === "approve" ? "Aprovar e enviar" : "Enviar pedido de ajustes"}
          </Button>
        )}
      </div>
    </div>
  )
}
