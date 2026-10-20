"use client"

import { MenvoDots } from "@/components/ui/menvo-loader"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import { useLocale, useTranslations } from "next-intl"
import { PendingCheckinPrompt } from "./PendingCheckinPrompt"
import { BookMentorshipSlotList } from "./BookMentorshipSlotList"
import { BookMentorshipConfirmStep } from "./BookMentorshipConfirmStep"
import { useBookMentorshipSubmit } from "./useBookMentorshipSubmit"
import { useBookMentorshipFlow } from "./useBookMentorshipFlow"
import { toIntlLocale, type TimeSlot } from "./book-mentorship-slots"

interface BookMentorshipModalProps {
  isOpen: boolean
  onClose: () => void
  mentorId: string
  mentorName: string
}

/**
 * Booking dialog: pending check-in gate -> slot list -> message + confirm.
 * Holds the flow state; each step is its own component and the submit/error
 * mapping lives in `useBookMentorshipSubmit`.
 */
export function BookMentorshipModal({
  isOpen,
  onClose,
  mentorId,
  mentorName
}: BookMentorshipModalProps) {
  const intlLocale = toIntlLocale(useLocale())
  const t = useTranslations("mentorship.booking")
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [message, setMessage] = useState("")
  const flow = useBookMentorshipFlow(isOpen, mentorId, intlLocale)
  const loadError = flow.hasError ? t("noSlotsDesc") : ""

  const booking = useBookMentorshipSubmit({
    mentorId,
    selectedSlot,
    message,
    onClose,
    onPendingCheckin: flow.restart,
    onSlotTaken: () => {
      flow.restart()
      setSelectedSlot(null)
    },
    onReset: () => {
      setSelectedSlot(null)
      setMessage("")
    }
  })

  const handleSelectSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    booking.clearError()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-full max-w-2xl p-0 overflow-hidden bg-white rounded-3xl border-0 shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("modalTitle")}</DialogTitle>
          <DialogDescription>{t("standardDuration", { name: mentorName })}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col max-h-[90vh]">
          <div className="p-6 bg-gradient-to-r from-primary to-primary-700 text-white relative">
            <span className="text-xs font-bold uppercase tracking-wider text-white/80">
              {t("modalTitle")}
            </span>
            <h2 className="text-2xl font-black mt-1">{mentorName}</h2>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            {flow.loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <MenvoDots />
                <p className="text-sm text-muted-foreground animate-pulse text-center">
                  Buscando horários disponíveis...
                </p>
              </div>
            ) : flow.pendingCheckin ? (
              <PendingCheckinPrompt pending={flow.pendingCheckin} onAnswered={flow.restart} />
            ) : loadError && !selectedSlot ? (
              <div className="py-12 text-center space-y-4">
                <div className="bg-red-50 text-red-700 p-4 rounded-xl inline-block text-sm">
                  {loadError}
                </div>
                <div>
                  <Button variant="outline" onClick={flow.restart} className="rounded-xl">
                    Tentar novamente
                  </Button>
                </div>
              </div>
            ) : !selectedSlot ? (
              <BookMentorshipSlotList
                slots={flow.slots}
                intlLocale={intlLocale}
                mentorId={mentorId}
                mentorName={mentorName}
                onSelect={handleSelectSlot}
              />
            ) : (
              <BookMentorshipConfirmStep
                slot={selectedSlot}
                intlLocale={intlLocale}
                message={message}
                onMessageChange={setMessage}
                error={booking.error}
                success={booking.success}
                isSubmitting={booking.isSubmitting}
                onBack={() => setSelectedSlot(null)}
                onConfirm={booking.submit}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
