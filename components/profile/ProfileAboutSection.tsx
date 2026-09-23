"use client"

import { useRef } from "react"
import { Camera, Loader2, MapPin } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth"
import { useSimpleImageUpload } from "@/hooks/useSimpleUpload"
import { useDetectLocation } from "@/hooks/useDetectLocation"
import { COMMON_TIMEZONES } from "@/lib/utils/timezone"
import type { ProfileFormData, ProfileFormPatch } from "./profile-form"

interface ProfileAboutSectionProps {
  form: ProfileFormData
  onChange: ProfileFormPatch
  isMentor: boolean
}

/**
 * "Perfil" tab: identity, visibility, location and timezone in one card.
 * These used to be split across "Pessoal" and "Localização" tabs with 3–4
 * fields each, which hid required info behind extra clicks.
 */
export function ProfileAboutSection({ form, onChange, isMentor }: ProfileAboutSectionProps) {
  const { refreshProfile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageUpload = useSimpleImageUpload("/api/upload/profile-photo")
  const location = useDetectLocation((loc) =>
    onChange({ city: loc.city || form.city, state: loc.state || form.state, country: loc.country || form.country })
  )

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const result = await imageUpload.upload(file)
    if (result.success) {
      onChange({ avatar_url: `${result.data.url}?t=${Date.now()}` })
      await refreshProfile()
      toast.success("Foto atualizada!")
    }
  }

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
          <div className="space-y-1">
            <Label htmlFor="is_public" className="text-base font-bold">Perfil público</Label>
            <p className="text-xs text-muted-foreground">
              {isMentor ? "Aparecer no diretório de mentores." : "Aparecer no mural de mentorados."}
            </p>
          </div>
          <Switch id="is_public" checked={form.is_public} onCheckedChange={(v) => onChange({ is_public: v })} />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="relative self-start">
            <Avatar className="h-24 w-24 border-2">
              <AvatarImage src={form.avatar_url} />
              <AvatarFallback>{form.first_name?.[0]}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              aria-label="Alterar foto"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageUpload.isUploading}
              className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg"
            >
              {imageUpload.isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            <Field label="Nome" value={form.first_name} onValue={(v) => onChange({ first_name: v })} />
            <Field label="Sobrenome" value={form.last_name} onValue={(v) => onChange({ last_name: v })} />
            <div className="sm:col-span-2">
              <Field
                label="Endereço do perfil (slug)"
                value={form.slug}
                onValue={(v) => onChange({ slug: v.toLowerCase().replace(/\s+/g, "-") })}
                placeholder="ex: maria-silva"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <Label>Bio</Label>
          <Textarea value={form.bio} onChange={(e) => onChange({ bio: e.target.value })} rows={4} placeholder="Conte sua história e o que te motiva..." />
        </div>

        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Localização</h3>
            <Button type="button" variant="outline" size="sm" onClick={location.detect} disabled={location.isDetecting}>
              {location.isDetecting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
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
      </CardContent>
    </Card>
  )
}

interface FieldProps {
  label: string
  value: string
  onValue: (value: string) => void
  placeholder?: string
}

/** Label + text input pair; the profile form has ~15 of these. */
export function Field({ label, value, onValue, placeholder }: FieldProps) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onValue(e.target.value)} placeholder={placeholder} />
    </div>
  )
}
