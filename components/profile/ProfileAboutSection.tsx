"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Field } from "./ProfileField"
import { ProfileLocationFields } from "./ProfileLocationFields"
import { ProfilePhotoPicker } from "./ProfilePhotoPicker"
import type { ProfileFormData, ProfileFormPatch } from "./profile-form"

interface ProfileAboutSectionProps {
  form: ProfileFormData
  onChange: ProfileFormPatch
  isMentor: boolean
}

/** Lowercase, spaces to hyphens, drop everything a URL slug cannot hold. */
const toSlug = (value: string) => value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

/**
 * "Perfil" tab: identity, visibility, location and timezone in one card.
 * These used to be split across "Pessoal" and "Localização" tabs with 3–4
 * fields each, which hid required info behind extra clicks. The photo and the
 * location block live in their own components.
 */
export function ProfileAboutSection({ form, onChange, isMentor }: ProfileAboutSectionProps) {
  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div id="tour-profile-public" className="flex items-center justify-between gap-4 p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
          <div className="space-y-1">
            <Label htmlFor="is_public" className="text-base font-bold">Perfil público</Label>
            <p className="text-xs text-muted-foreground">
              {isMentor
                ? "Aparecer no diretório de mentores."
                : "Aparecer no mural de mentorados, visível só para mentores logados. Seu e-mail e telefone nunca são exibidos. Ao ativar, você declara ter 18 anos ou mais."}
            </p>
          </div>
          <Switch id="is_public" checked={form.is_public} onCheckedChange={(v) => onChange({ is_public: v })} />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <ProfilePhotoPicker
            avatarUrl={form.avatar_url}
            firstName={form.first_name}
            onUploaded={(url) => onChange({ avatar_url: url })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            <Field label="Nome *" value={form.first_name} onValue={(v) => onChange({ first_name: v })} />
            <Field label="Sobrenome *" value={form.last_name} onValue={(v) => onChange({ last_name: v })} />
            <div className="sm:col-span-2 space-y-1">
              <div className="flex items-center justify-between">
                <Label>Endereço do perfil (slug) *</Label>
                <button
                  type="button"
                  onClick={() => onChange({ slug: toSlug(`${form.first_name || ""}-${form.last_name || ""}`) })}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Gerar automaticamente
                </button>
              </div>
              <Input
                value={form.slug}
                onChange={(e) => onChange({ slug: toSlug(e.target.value) })}
                placeholder="ex: maria-silva"
              />
              <p className="text-[10px] text-muted-foreground">Sua URL será: menvo.com.br/mentee/{form.slug || "..."}</p>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <Label>Bio</Label>
          <Textarea value={form.bio} onChange={(e) => onChange({ bio: e.target.value })} rows={4} placeholder="Conte sua história e o que te motiva..." />
        </div>

        <ProfileLocationFields form={form} onChange={onChange} />
      </CardContent>
    </Card>
  )
}
