"use client"

import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TutorialsSection } from "@/components/mentor/TutorialsSection"
import { MenteeTutorialsSection } from "@/components/mentee/MenteeTutorialsSection"
import { MentorApproachFields } from "./MentorApproachFields"
import { MentorshipStatusCard } from "./MentorshipStatusCard"
import type { ProfileFormData, ProfileFormPatch } from "./profile-form"

interface ProfileMentorshipSectionProps {
  form: ProfileFormData
  onChange: ProfileFormPatch
  isMentor: boolean
  isPendingMentor: boolean
  verificationStatus?: string | null
  /** Re-fetches profile + role after a status change so the card flips state immediately. */
  onStatusChange: () => Promise<void>
}

/**
 * "Mentoria" tab: mentor status (request / pending / active / stop) plus the
 * mentor's approach texts. The approach fields are edited inline for mentors
 * and inside the request dialog for everyone else, so there is one place to fill them.
 */
export function ProfileMentorshipSection({ form, onChange, isMentor, isPendingMentor, verificationStatus, onStatusChange }: ProfileMentorshipSectionProps) {
  const t = useTranslations("profile")

  const post = async (path: string, body: object | undefined, successMessage: string) => {
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error?.message || data.error || "Erro ao processar")
      toast.success(successMessage)
      await onStatusChange()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao processar")
    }
  }

  return (
    <div className="space-y-6">
      <MentorshipStatusCard
        form={form}
        onChange={onChange}
        isMentor={isMentor}
        isPendingMentor={isPendingMentor}
        verificationStatus={verificationStatus}
        onAction={post}
      />

      {(isMentor || isPendingMentor) && (
        <Card>
          <CardHeader>
            <CardTitle>{t("form.mentorshipApproachTitle")}</CardTitle>
            <CardDescription>{t("form.mentorshipApproachDescription")}</CardDescription>
          </CardHeader>
          <CardContent><MentorApproachFields form={form} onChange={onChange} /></CardContent>
        </Card>
      )}

      {isMentor || isPendingMentor ? <TutorialsSection /> : <MenteeTutorialsSection />}
    </div>
  )
}
