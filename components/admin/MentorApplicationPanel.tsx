"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Star, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"

export type MentorApplicationStatus = "pending" | "approved" | "rejected" | null

interface MentorApplicationPanelProps {
  userId: string
  status: MentorApplicationStatus
  isMentor: boolean
  hasTopics: boolean
  isPublic: boolean
  onIsPublicChange: (value: boolean) => void
  /** Called after a decision was saved, so the parent can refresh/close. */
  onDecided: () => void
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  none: { label: "Não pediu para ser mentor", className: "bg-muted text-muted-foreground" },
  pending: { label: "Aguardando aprovação", className: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Mentor aprovado", className: "bg-green-100 text-green-800" },
  rejected: { label: "Ajustes solicitados", className: "bg-orange-100 text-orange-800" }
}

/**
 * Mentor-application section of the admin user modal. Decisions go through
 * POST /api/admin/verify — the same path as /dashboard/admin/verifications —
 * so approving here also grants the mentor role, publishes the profile and
 * notifies the person by chat and e-mail. It also shows *why* someone is or
 * isn't in the /mentors directory, which needs all three checks below.
 */
export function MentorApplicationPanel({
  userId,
  status,
  isMentor,
  hasTopics,
  isPublic,
  onIsPublicChange,
  onDecided
}: MentorApplicationPanelProps) {
  const [notes, setNotes] = useState("")
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [submitting, setSubmitting] = useState<"approved" | "rejected" | null>(null)

  const statusInfo = STATUS_LABEL[status ?? "none"]
  const listed = isMentor && isPublic && hasTopics

  const decide = async (decision: "approved" | "rejected") => {
    if (decision === "rejected" && !notes.trim()) {
      toast.error("Escreva o que precisa ser ajustado — a pessoa recebe esse texto.")
      return
    }
    setSubmitting(decision)
    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          status: decision,
          notes: notes.trim() || undefined,
          notifyEmail
        })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Erro ao salvar decisão")
      toast.success(decision === "approved" ? "Mentor aprovado e publicado." : "Pedido de ajustes enviado.")
      onDecided()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar decisão")
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div className="space-y-4 p-5 border-2 rounded-xl border-yellow-200 bg-yellow-50/50">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="text-base font-bold flex items-center gap-2 text-yellow-900">
          <Star className="h-5 w-5 text-yellow-600 fill-current" /> Candidatura a mentor
        </Label>
        <Badge className={`border-none ${statusInfo.className}`}>{statusInfo.label}</Badge>
      </div>

      <ul className="grid gap-1.5 text-sm">
        <ChecklistItem ok={isMentor} label="Tem o papel Mentor (concedido na aprovação)" />
        <ChecklistItem ok={hasTopics} label="Preencheu áreas de expertise ou tópicos" />
        <li className="flex items-center gap-2">
          <Checkbox
            id="is_public"
            checked={isPublic}
            onCheckedChange={(checked) => onIsPublicChange(checked === true)}
          />
          <Label htmlFor="is_public" className="cursor-pointer font-normal">
            Perfil público (salvo com &quot;Salvar Alterações&quot;)
          </Label>
        </li>
      </ul>
      <p className="text-xs text-muted-foreground">
        {listed
          ? "Aparece em /mentors."
          : "Não aparece em /mentors enquanto algum item acima estiver pendente."}
      </p>

      {status !== "approved" || !isMentor ? (
        <div className="space-y-3 border-t border-yellow-200 pt-4">
          <div className="space-y-2">
            <Label htmlFor="verification_notes" className="font-semibold">
              Mensagem para a pessoa (vai no chat e no e-mail)
            </Label>
            <Textarea
              id="verification_notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional na aprovação. Obrigatório ao pedir ajustes (ex.: 'Adicione seu LinkedIn')."
              className="bg-white min-h-[80px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="notify-email" checked={notifyEmail} onCheckedChange={(c) => setNotifyEmail(c === true)} />
            <Label htmlFor="notify-email" className="text-sm cursor-pointer font-normal">
              Também avisar por e-mail
            </Label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => decide("approved")} disabled={submitting !== null}>
              {submitting === "approved" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aprovar como mentor
            </Button>
            {status === "pending" && (
              <Button variant="outline" onClick={() => decide("rejected")} disabled={submitting !== null}>
                {submitting === "rejected" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Pedir ajustes
              </Button>
            )}
          </div>
          {status === "pending" && (
            <p className="text-xs text-muted-foreground">
              Quer um rascunho da mensagem com IA?{" "}
              <Link href="/dashboard/admin/verifications" className="text-primary underline">
                Abrir em Verificações
              </Link>
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
}

function ChecklistItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={ok ? "" : "text-muted-foreground"}>{label}</span>
    </li>
  )
}
