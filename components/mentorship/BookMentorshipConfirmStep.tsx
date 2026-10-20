"use client"

import { Calendar, CheckCircle, Check, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import type { TimeSlot } from "./book-mentorship-slots"

interface BookMentorshipConfirmStepProps {
  slot: TimeSlot
  intlLocale: string
  message: string
  onMessageChange: (value: string) => void
  error: string
  success: boolean
  isSubmitting: boolean
  onBack: () => void
  onConfirm: () => void
}

/**
 * Step 2 of the booking modal: the chosen slot, the required message (min 20
 * chars) and the confirm/back buttons. Controlled by the modal so a slot taken
 * by someone else can reset it from outside.
 */
export function BookMentorshipConfirmStep({
  slot,
  intlLocale,
  message,
  onMessageChange,
  error,
  success,
  isSubmitting,
  onBack,
  onConfirm
}: BookMentorshipConfirmStepProps) {
  const t = useTranslations("mentorship.booking")

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 rounded-2xl border border-primary/20 relative overflow-hidden">
        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
          {t("selectedSlot")}
        </p>
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-primary text-white rounded-xl flex items-center justify-center shadow-md shadow-primary/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-foreground text-base capitalize">
              {slot.date.toLocaleDateString(intlLocale, { weekday: "long" })},{" "}
              {slot.formatted_date}
            </p>
            <p className="text-xs text-primary font-semibold mt-0.5">
              {t("atTime", { time: slot.formatted_time })}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <label htmlFor="message" className="block text-sm font-semibold text-foreground">
          {t("messageLabel")} *
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
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
          <p className="text-[11px] text-muted-foreground">{t("requiredNote")}</p>
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

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 h-12 rounded-xl font-medium"
        >
          {t("chooseOtherSlot")}
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting || message.length < 20}
          className="flex-1 h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 animate-spin h-4 w-4" />
              {t("submitting")}
            </>
          ) : (
            t("confirmButton")
          )}
        </Button>
      </div>
    </div>
  )
}
