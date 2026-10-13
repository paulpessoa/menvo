"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, UserX } from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { mentorshipService } from "@/lib/services/mentorship/mentorship.service"

interface NoShowModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentId: string | number
  menteeName: string
  onSuccess?: (notes?: string) => void
}

/**
 * Modal para o mentor registrar a ausência do mentorado (no-show) em uma sessão
 * e adicionar comentários ou anotações explicativas.
 */
export function NoShowModal({
  open,
  onOpenChange,
  appointmentId,
  menteeName,
  onSuccess
}: NoShowModalProps) {
  const t = useTranslations("appointments")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      await mentorshipService.markNoShow(String(appointmentId), notes)
      toast.success(t("noShowSuccess"))
      onOpenChange(false)
      onSuccess?.(notes)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao registrar ausência.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <UserX className="h-5 w-5" />
            <DialogTitle>{t("noShowTitle")}</DialogTitle>
          </div>
          <DialogDescription>
            {t("noShowDescription", { name: menteeName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="no-show-notes" className="text-sm font-medium">
              {t("noShowCommentLabel")}
            </Label>
            <Textarea
              id="no-show-notes"
              placeholder={t("noShowCommentPlaceholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none min-h-[100px]"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {notes.length}/1000
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t("cancelModalButton", { defaultValue: "Cancelar" })}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("saving", { defaultValue: "Salvando..." })}
              </>
            ) : (
              t("noShowConfirmButton")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
