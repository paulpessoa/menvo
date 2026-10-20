"use client"

import { MenvoDots } from "@/components/ui/menvo-loader"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth"
import { useLocale, useTranslations } from "next-intl"
import { PendingCheckinPrompt } from "./PendingCheckinPrompt"
import { BookMentorshipSlotList } from "./BookMentorshipSlotList"
import { BookMentorshipConfirmStep } from "./BookMentorshipConfirmStep"
import { useBookMentorshipSubmit } from "./useBookMentorshipSubmit"
import {
  toIntlLocale,
  toTimeSlots,
  type RawAvailabilitySlot,
  type TimeSlot
} from "./book-mentorship-slots"
import { getMyPendingCheckinAction } from "@/app/actions/session-checkin"
import type { PendingCheckin } from "@/lib/services/appointments/checkin-responses.service"

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
  const { user } = useAuth()
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [message, setMessage] = useState("")
  const [pendingCheckin, setPendingCheckin] = useState<PendingCheckin | null>(null)

  const loadAvailability = async () => {
    try {
      setLoading(true)
      setLoadError("")
      setPendingCheckin(null)
      setAvailableSlots([])

      // Antes de agendar de novo, o mentorado diz se a última sessão
      // aconteceu (1 clique; avaliar é opcional). Ver docs/domains/session-checkin.md §4.
      if (user?.id) {
        const pending = await getMyPendingCheckinAction()
        if (pending) {
          setPendingCheckin(pending)
          setLoading(false)
          return
        }
      }

      const startDate = new Date().toISOString().split("T")[0]
      const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]

      const response = await fetch(
        `/api/appointments/availability?mentor_id=${mentorId}&start_date=${startDate}&end_date=${endDate}`
      )
      if (!response.ok) throw new Error(t("noSlotsDesc"))

      const data = (await response.json()) as { availableSlots?: RawAvailabilitySlot[] }
      setAvailableSlots(toTimeSlots(data.availableSlots ?? [], intlLocale))
    } catch (err) {
      setLoadError((err instanceof Error && err.message) || t("noSlotsDesc"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadAvailability()
    }
  }, [isOpen, mentorId])

  const booking = useBookMentorshipSubmit({
    mentorId,
    selectedSlot,
    message,
    onClose,
    onPendingCheckin: loadAvailability,
    onSlotTaken: () => {
      loadAvailability()
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
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <MenvoDots />
                <p className="text-sm text-muted-foreground animate-pulse text-center">
                  Buscando horários disponíveis...
                </p>
              </div>
            ) : pendingCheckin ? (
              <PendingCheckinPrompt pending={pendingCheckin} onAnswered={loadAvailability} />
            ) : loadError && !selectedSlot ? (
              <div className="py-12 text-center space-y-4">
                <div className="bg-red-50 text-red-700 p-4 rounded-xl inline-block text-sm">
                  {loadError}
                </div>
                <div>
                  <Button variant="outline" onClick={loadAvailability} className="rounded-xl">
                    Tentar novamente
                  </Button>
                </div>
              </div>
            ) : !selectedSlot ? (
              <BookMentorshipSlotList
                slots={availableSlots}
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
