"use client"

import { useEffect } from "react"
import { Loader2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDetectLocation } from "@/hooks/useDetectLocation"
import { COMMON_TIMEZONES } from "@/lib/utils/timezone"
import { Field } from "./ProfileField"
import type { ProfileFormData, ProfileFormPatch } from "./profile-form"

interface ProfileLocationFieldsProps {
  form: ProfileFormData
  onChange: ProfileFormPatch
}

/** City, state, country and the timezone the schedule uses. Detects the location on mount if it is empty. */
export function ProfileLocationFields({ form, onChange }: ProfileLocationFieldsProps) {
  const location = useDetectLocation((loc) =>
    onChange({ city: loc.city || form.city, state: loc.state || form.state, country: loc.country || form.country })
  )

  // Detect location on mount if not filled yet
  useEffect(() => {
    if (!form.city && !form.state) {
      location.detect(true) // silent
    }
  }, []) // only run once on mount

  return (
    <div className="space-y-3 pt-4 border-t">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Localização</h3>
        <Button type="button" variant="outline" size="sm" onClick={() => location.detect(false)} disabled={location.isDetecting}>
          {location.isDetecting && <Loader2 className="mr-2 animate-spin h-4 w-4" />}
          {location.isDetecting ? "Detectando..." : "Detectar"}
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Cidade" value={form.city} onValue={(v) => onChange({ city: v })} />
        <Field label="Estado" value={form.state} onValue={(v) => onChange({ state: v })} />
        <Field label="País" value={form.country} onValue={(v) => onChange({ country: v })} />
      </div>
      <div className="space-y-1">
        <Label>Fuso horário (usado na agenda)</Label>
        <Select value={form.timezone} onValueChange={(v) => onChange({ timezone: v })}>
          <SelectTrigger><SelectValue placeholder="Selecione seu fuso horário" /></SelectTrigger>
          <SelectContent>
            {COMMON_TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>{tz.label} ({tz.value})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
