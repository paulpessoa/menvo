"use client"

import { useTranslations } from "next-intl"
import { Label } from "@/components/ui/label"
import { TextareaWithVoice } from "@/components/ui/textarea-with-voice"
import type { ProfileFormData, ProfileFormPatch } from "./profile-form"

interface MentorApproachFieldsProps {
  form: ProfileFormData
  onChange: ProfileFormPatch
}

/** How the person plans to mentor and what to expect: edited inline by mentors and inside the request dialog by everyone else. */
export function MentorApproachFields({ form, onChange }: MentorApproachFieldsProps) {
  const t = useTranslations("profile")

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>{t("form.mentorshipApproachLabel")}</Label>
        <TextareaWithVoice minHeight="min-h-[96px]" value={form.mentorship_approach} onChange={(v) => onChange({ mentorship_approach: v })} placeholder={t("form.mentorshipApproachPlaceholder")} />
      </div>
      <div className="space-y-1">
        <Label>{t("form.whatToExpectLabel")}</Label>
        <TextareaWithVoice minHeight="min-h-[96px]" value={form.what_to_expect} onChange={(v) => onChange({ what_to_expect: v })} placeholder={t("form.whatToExpectPlaceholder")} />
      </div>
    </div>
  )
}
