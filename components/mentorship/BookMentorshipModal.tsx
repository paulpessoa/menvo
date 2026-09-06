"use client"

import { useState, useEffect } from "react"
import {
  X,
  Calendar,
  Clock,
  Loader2,
  Star,
  Plus,
  CheckCircle,
  AlertCircle,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import { mentorshipService } from "@/lib/services/mentorship/mentorship.service"
import { useAuth } from "@/lib/auth"
import { useLocale, useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"

interface TimeSlot {
  day_of_week: number
  start_time: string
  end_time: string
  date: Date
  formatted_date: string
  formatted_time: string
}

interface BookMentorshipModalProps {
  isOpen: boolean
  onClose: () => void
  mentorId: string
  mentorName: string
}

export function BookMentorshipModal({
  isOpen,
  onClose,
  mentorId,
  mentorName
}: BookMentorshipModalProps) {
  const locale = useLocale()
  const intlLocale = locale === "en" ? "en-US" : locale === "es" ? "es-ES" : "pt-BR"
  const t = useTranslations("mentorship.booking")
  const { user } = useAuth()
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [pendingEvaluation, setPendingEvaluation] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadAvailability()
    }
  }, [isOpen, mentorId])

  const loadAvailability = async () => {
    try {
      setLoading(true)
      setError("")
      setPendingEvaluation(false)
      setAvailableSlots([])

      if (user?.id) {
        const pending = await mentorshipService.hasPendingEvaluations(user.id)
        if (pending) {
          setPendingEvaluation(true)
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

      if (!response.ok) {
        throw new Error(t("noSlotsDesc"))
      }

      const data = await response.json()

      const formattedSlots: TimeSlot[] = []

      data.availableSlots?.forEach((slot: any) => {
        const [year, month, day] = slot.date.split("-").map(Number)
        const date = new Date(year, month - 1, day)

        formattedSlots.push({
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          date,
          formatted_date: date.toLocaleDateString(intlLocale, {
            day: "numeric",
            month: "short"
          }),
          formatted_time: `${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`
        })
      })

      setAvailableSlots(formattedSlots)
    } catch (err: any) {
      setError(err.message || t("noSlotsDesc"))
    } finally {
      setLoading(false)
    }
  }

  const handleBookSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    setError("")
  }

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return

    setIsSubmitting(true)
    setError("")

    try {
      const year = selectedSlot.date.getFullYear()
      const month = String(selectedSlot.date.getMonth() + 1).padStart(2, "0")
      const day = String(selectedSlot.date.getDate()).padStart(2, "0")
      const requestedDate = `${year}-${month}-${day}`
      const requestedStartTime = selectedSlot.start_time
      const requestedEndTime = selectedSlot.end_time

      const payload = {
        mentorId,
        mentor_id: mentorId,
        requestedDate,
        requested_date: requestedDate,
        requestedStartTime,
        requested_start_time: requestedStartTime,
        requestedEndTime,
        requested_end_time: requestedEndTime,
        durationMinutes: 45,
        duration_minutes: 45,
        message: message.trim()
      }

      const response = await fetch("/api/appointments/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        if (response.status === 409) {
          throw new Error(
            data.message ||
              "Este horário acabou de ser agendado por outro participante. Por favor, escolha outro horário."
          )
        }
        throw new Error(data.error || data.message || "Erro ao agendar mentoria")
      }

      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
        setSelectedSlot(null)
        setMessage("")
        window.location.href = `/${locale}/mentorship/mentee`
      }, 1500)
    } catch (err: any) {
      setError(err.message || "Falha ao confirmar o agendamento.")
      if (err.message?.includes("acabou de ser agendado")) {
        loadAvailability()
        setSelectedSlot(null)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white rounded-3xl border-0 shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("modalTitle")}</DialogTitle>
          <DialogDescription>
            {t("standardDuration", { name: mentorName })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col max-h-[90vh]">
          <div className="p-6 bg-gradient-to-r from-primary to-primary-700 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-white/80 hover:text-white transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold uppercase tracking-wider text-white/80">
              {t("modalTitle")}
            </span>
            <h2 className="text-2xl font-black mt-1">{mentorName}</h2>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse text-center">
                  Buscando horários disponíveis...
                </p>
              </div>
            ) : pendingEvaluation ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto text-yellow-600 shadow-sm">
                  <Star className="w-10 h-10 fill-current" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  {t("pendingEvaluationsTitle")}
                </h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                  {t("pendingEvaluationsDesc")}
                </p>
                <Button asChild className="mt-4 rounded-xl font-semibold shadow-sm">
                  <Link href="/mentorship/mentee">{t("evaluateNow")}</Link>
                </Button>
              </div>
            ) : error && !selectedSlot ? (
              <div className="py-12 text-center space-y-4">
                <div className="bg-red-50 text-red-700 p-4 rounded-xl inline-block text-sm">
                  {error}
                </div>
                <div>
                  <Button variant="outline" onClick={loadAvailability} className="rounded-xl">
                    Tentar novamente
                  </Button>
                </div>
              </div>
            ) : !selectedSlot ? (
              <div className="space-y-6">
                <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                  <div className="bg-blue-500 text-white rounded-full p-1 mt-0.5 shadow-sm">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-sm text-blue-900 leading-relaxed">
                    {t("standardDuration", { name: mentorName })}
                  </p>
                </div>

                {availableSlots.length === 0 ? (
                  <div className="text-center py-16 bg-muted/30 rounded-2xl border-2 border-dashed border-border/70 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                      <Calendar className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">
                      {t("noSlotsTitle")}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                      {t("noSlotsDesc")}
                    </p>
                    <Button asChild variant="outline" className="rounded-xl mt-2">
                      <Link href="/mentors">Explorar Outros Mentores</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleBookSlot(slot)}
                        className="flex items-center justify-between p-4 border border-border rounded-2xl hover:border-primary hover:bg-primary/[0.03] hover:shadow-md transition-all text-left group bg-card"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="flex flex-col items-center justify-center w-12 h-12 bg-primary/10 rounded-xl group-hover:bg-primary text-primary group-hover:text-white transition-all shadow-xs">
                            <span className="text-[10px] uppercase font-extrabold tracking-wider">
                              {slot.formatted_date.split(",")[0]}
                            </span>
                            <span className="text-lg font-black leading-none mt-0.5">
                              {slot.date.getDate()}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-sm capitalize">
                              {slot.date.toLocaleDateString(intlLocale, { weekday: "long" })}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {slot.formatted_time}
                            </p>
                          </div>
                        </div>
                        <div className="h-8 w-8 rounded-full border border-border flex items-center justify-center group-hover:border-primary group-hover:bg-primary group-hover:text-white transition-all text-muted-foreground">
                          <Plus className="w-4 h-4" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 p-5 rounded-2xl border border-primary/20 relative overflow-hidden">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                    {t("selectedSlot")}
                  </p>
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 bg-primary text-white rounded-xl flex items-center justify-center shadow-md shadow-primary/20">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-base capitalize">
                        {selectedSlot.date.toLocaleDateString(intlLocale, { weekday: "long" })},{" "}
                        {selectedSlot.formatted_date}
                      </p>
                      <p className="text-xs text-primary font-semibold mt-0.5">
                        {t("atTime", { time: selectedSlot.formatted_time })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="message"
                    className="block text-sm font-semibold text-foreground"
                  >
                    {t("messageLabel")} *
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t("messagePlaceholder")}
                    rows={4}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none text-sm bg-background text-foreground placeholder:text-muted-foreground"
                  />
                  <div className="flex justify-between items-center px-1">
                    <p
                      className={`text-xs font-medium transition-colors ${
                        message.length < 20 ? "text-amber-600" : "text-emerald-600 font-semibold"
                      }`}
                    >
                      {message.length >= 20 && <Check className="inline-block h-3.5 w-3.5 mr-1" />}
                      {t("charCounter", { count: message.length })}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {t("requiredNote")}
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm font-medium">
                    ⚠️ {error}
                  </div>
                )}

                {success && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    {t("successMessage")}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedSlot(null)}
                    disabled={isSubmitting}
                    className="flex-1 h-12 rounded-xl font-medium"
                  >
                    {t("chooseOtherSlot")}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleConfirmBooking}
                    disabled={isSubmitting || message.length < 20}
                    className="flex-1 h-12 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t("submitting")}
                      </>
                    ) : (
                      t("confirmButton")
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
