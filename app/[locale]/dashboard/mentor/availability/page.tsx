"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/utils/supabase/client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Clock,
  Plus,
  Trash2,
  Save,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Loader2
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useTranslations } from "next-intl"
import type { TablesInsert } from "@/lib/types/supabase"

interface AvailabilitySlot {
  id?: number | string
  day_of_week: number
  start_time: string
  end_time: string
  timezone: string | null
}

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0")
  return [
    { value: `${hour}:00:00`, label: `${hour}:00` },
    { value: `${hour}:30:00`, label: `${hour}:30` }
  ]
}).flat()
export default function MentorAvailabilityPage() {
  const t = useTranslations("availability")
  const commonT = useTranslations("common")
  const router = useRouter()
  const { user, profile, role, loading: authLoading } = useAuth()
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)
  const supabase = createClient()

  const DAYS_OF_WEEK = [
    { value: 0, label: t("days.0") },
    { value: 1, label: t("days.1") },
    { value: 2, label: t("days.2") },
    { value: 3, label: t("days.3") },
    { value: 4, label: t("days.4") },
    { value: 5, label: t("days.5") },
    { value: 6, label: t("days.6") }
  ]

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push("/login")
      return
    }

    if (role !== "mentor") {
      router.push("/dashboard")
      return
    }

    fetchAvailability()
  }, [user, role, authLoading, router])

  const fetchAvailability = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("mentor_availability")
        .select("*")
        .eq("mentor_id", user.id)
        .order("day_of_week")
        .order("start_time")

      if (error) throw error

      setAvailability(data || [])
    } catch (error) {
      console.error("Error fetching availability:", error)
      setMessage({ type: "error", text: t("errorLoad") })
    } finally {
      setLoading(false)
    }
  }

  const addAvailabilitySlot = () => {
    const newSlot: AvailabilitySlot = {
      day_of_week: 1,
      start_time: "09:00:00",
      end_time: "17:00:00",
      timezone: profile?.timezone || "America/Sao_Paulo"
    }
    setAvailability([...availability, newSlot])
  }

  const updateSlot = (
    index: number,
    field: keyof AvailabilitySlot,
    value: string | number
  ) => {
    const updated = [...availability]
    updated[index] = { ...updated[index], [field]: value }
    setAvailability(updated)
  }

  const removeSlot = (index: number) => {
    const updated = availability.filter((_, i) => i !== index)
    setAvailability(updated)
  }

  const validateSlots = (): string | null => {
    for (let i = 0; i < availability.length; i++) {
      const slot = availability[i]

      if (slot.start_time >= slot.end_time) {
        const dayLabel =
          DAYS_OF_WEEK.find((d) => d.value === slot.day_of_week)?.label || ""
        return t("invalidTime", { day: dayLabel })
      }

      for (let j = i + 1; j < availability.length; j++) {
        const otherSlot = availability[j]
        if (slot.day_of_week === otherSlot.day_of_week) {
          const slotStart = new Date(`2000-01-01T${slot.start_time}`)
          const slotEnd = new Date(`2000-01-01T${slot.end_time}`)
          const otherStart = new Date(`2000-01-01T${otherSlot.start_time}`)
          const otherEnd = new Date(`2000-01-01T${otherSlot.end_time}`)

          if (slotStart < otherEnd && slotEnd > otherStart) {
            const dayLabel =
              DAYS_OF_WEEK.find((d) => d.value === slot.day_of_week)?.label ||
              ""
            return t("overlappingTime", { day: dayLabel })
          }
        }
      }
    }
    return null
  }

  const saveAvailability = async () => {
    if (!user?.id) return

    const error = validateSlots()
    if (error) {
      setMessage({ type: "error", text: error })
      return
    }

    try {
      setSaving(true)
      setMessage(null)

      // Delete existing availability
      const { error: deleteError } = await supabase
        .from("mentor_availability")
        .delete()
        .eq("mentor_id", user.id)

      if (deleteError) throw deleteError

      // Insert new availability
      if (availability.length > 0) {
        const slotsToInsert: TablesInsert<"mentor_availability">[] =
          availability.map((slot) => ({
            mentor_id: user.id,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            timezone: slot.timezone || "America/Sao_Paulo"
          }))

        const { error: insertError } = await (supabase
          .from("mentor_availability") as any)
          .insert(slotsToInsert)

        if (insertError) throw insertError
      }

      setMessage({ type: "success", text: t("successSave") })
      await fetchAvailability()
    } catch (error) {
      console.error("Error saving availability:", error)
      setMessage({ type: "error", text: t("errorSave") })
    } finally {
      setSaving(false)
    }
  }

  const getAvailabilityPreview = () => {
    const grouped = availability.reduce(
      (acc, slot) => {
        const day = slot.day_of_week
        if (!acc[day]) acc[day] = []
        acc[day].push(slot)
        return acc
      },
      {} as Record<number, AvailabilitySlot[]>
    )

    return Object.entries(grouped)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([day, slots]) => (
        <div key={day} className="mb-4 last:mb-0">
          <h4 className="font-bold text-sm mb-1 uppercase tracking-wider text-muted-foreground">
            {DAYS_OF_WEEK.find((d) => d.value === parseInt(day))?.label}
          </h4>
          <div className="flex flex-wrap gap-2">
            {slots
              .sort((a, b) => a.start_time.localeCompare(b.start_time))
              .map((slot, i) => (
                <Badge key={i} variant="secondary" className="px-3 py-1">
                  {slot.start_time.substring(0, 5)} -{" "}
                  {slot.end_time.substring(0, 5)}
                </Badge>
              ))}
          </div>
        </div>
      ))
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="w-fit"
        >
          {commonT("back")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {message && (
            <Alert
              variant={message.type === "success" ? "default" : "destructive"}
            >
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" /> {t("slotsTitle")}
                </CardTitle>
                <CardDescription>{t("slotsSubtitle")}</CardDescription>
              </div>
              <Button
                onClick={addAvailabilitySlot}
                size="sm"
                className="gap-1 rounded-full"
              >
                <Plus className="h-4 w-4" /> {t("addSlot")}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {availability.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground">{t("noSlots")}</p>
                  <Button
                    variant="link"
                    onClick={addAvailabilitySlot}
                    className="mt-2"
                  >
                    {t("addFirstSlot")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {availability.map((slot, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow group"
                    >
                      <div className="flex-1 w-full sm:w-auto">
                        <Select
                          value={slot.day_of_week.toString()}
                          onValueChange={(val) =>
                            updateSlot(index, "day_of_week", parseInt(val))
                          }
                        >
                          <SelectTrigger className="w-full sm:w-40 font-medium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS_OF_WEEK.map((day) => (
                              <SelectItem
                                key={day.value}
                                value={day.value.toString()}
                              >
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Select
                          value={slot.start_time}
                          onValueChange={(val) =>
                            updateSlot(index, "start_time", val)
                          }
                        >
                          <SelectTrigger className="w-full sm:w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map((time) => (
                              <SelectItem key={time.value} value={time.value}>
                                {time.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <span className="text-muted-foreground font-medium">
                          -
                        </span>

                        <Select
                          value={slot.end_time}
                          onValueChange={(val) =>
                            updateSlot(index, "end_time", val)
                          }
                        >
                          <SelectTrigger className="w-full sm:w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map((time) => (
                              <SelectItem key={time.value} value={time.value}>
                                {time.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSlot(index)}
                        className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4">
            <Button
              onClick={saveAvailability}
              disabled={saving || availability.length === 0}
              size="lg"
              className="px-8 gap-2 shadow-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />{" "}
                  {commonT("saving")}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> {t("save")}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />{" "}
                {t("previewTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availability.length > 0 ? (
                <div className="space-y-4">{getAvailabilityPreview()}</div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  {t("noAvailability")}
                </p>
              )}
            </CardContent>
          </Card>

          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 text-xs">
              {t("timezoneWarning")}{" "}
              <strong>{profile?.timezone || "America/Sao_Paulo"}</strong>.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}
