"use client"

import { Calendar, Clock, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/routing"
import { AvailabilityAlertButton } from "./AvailabilityAlertButton"
import type { TimeSlot } from "./book-mentorship-slots"

interface BookMentorshipSlotListProps {
  slots: TimeSlot[]
  intlLocale: string
  mentorId: string
  mentorName: string
  onSelect: (slot: TimeSlot) => void
}

/**
 * Step 1 of the booking modal: the standard-duration notice plus the slot grid,
 * or the "no slots" empty state with the availability alert.
 */
export function BookMentorshipSlotList({
  slots,
  intlLocale,
  mentorId,
  mentorName,
  onSelect
}: BookMentorshipSlotListProps) {
  const t = useTranslations("mentorship.booking")

  return (
    <div className="space-y-4">
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
        <div className="bg-primary text-white rounded-full p-1 mt-0.5 shadow-sm">
          <Clock className="w-3.5 h-3.5" />
        </div>
        <p className="text-sm text-foreground leading-relaxed">
          {t("standardDuration", { name: mentorName })}
        </p>
      </div>

      {slots.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-2xl border-2 border-dashed border-border/70 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-foreground">{t("noSlotsTitle")}</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            {t("noSlotsDesc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center items-center pt-2">
            <AvailabilityAlertButton mentorId={mentorId} mentorName={mentorName} />
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/mentors">Explorar Outros Mentores</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {slots.map((slot, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onSelect(slot)}
              className="flex items-center justify-between p-4 border border-border rounded-2xl hover:border-primary hover:bg-primary/[0.03] hover:shadow-md transition-all text-left group bg-card"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex flex-col items-center justify-center w-12 h-12 bg-primary/10 rounded-xl group-hover:bg-primary text-primary group-hover:text-white transition-all shadow-xs">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider">
                    {slot.date.toLocaleDateString(intlLocale, { month: "short" }).replace(".", "")}
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
  )
}
