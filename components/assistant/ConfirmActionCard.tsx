"use client"

import { Button } from "@/components/ui/button"
import type { ConfirmActionEvent } from "@/lib/ai/protocol"

export type ConfirmStatus = "pending" | "running" | "done" | "cancelled"

interface ConfirmActionCardProps {
  proposal: Pick<ConfirmActionEvent, "title" | "summary">
  status: ConfirmStatus
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Shows an action the assistant PROPOSED and only runs it on the user's click.
 * Exists because agent writes must never execute on the model's say-so alone
 * (lib/agents `confirmation: "user"`). Buttons lock once clicked so a double
 * tap cannot submit the same feedback twice.
 */
export function ConfirmActionCard({ proposal, status, onConfirm, onCancel }: ConfirmActionCardProps) {
  const settled = status === "done" || status === "cancelled"

  return (
    <div role="group" aria-label={proposal.title} className="w-fit max-w-full rounded-2xl border bg-background p-4 shadow-sm">
      <p className="text-sm font-semibold">{proposal.title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{proposal.summary}</p>

      {settled ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {status === "done" ? "Confirmado" : "Cancelado"}
        </p>
      ) : (
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={onConfirm} disabled={status === "running"}>
            {status === "running" ? "Enviando..." : "Confirmar"}
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel} disabled={status === "running"}>
            Cancelar
          </Button>
        </div>
      )}
    </div>
  )
}
