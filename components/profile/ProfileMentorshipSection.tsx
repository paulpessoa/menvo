"use client"

import { AlertCircle, Check, ShieldCheck, UserMinus, UserPlus } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { TutorialsSection } from "@/components/mentor/TutorialsSection"
import type { ProfileFormData, ProfileFormPatch } from "./profile-form"

interface ProfileMentorshipSectionProps {
  form: ProfileFormData
  onChange: ProfileFormPatch
  isMentor: boolean
  isPendingMentor: boolean
  /** Re-fetches profile + role after a status change so the card flips state immediately. */
  onStatusChange: () => Promise<void>
}

/**
 * "Mentoria" tab: mentor status (request / pending / active / stop) plus the
 * mentor's approach texts. The approach fields are edited inline for mentors
 * and inside the request dialog for everyone else, so there is one place to fill them.
 */
export function ProfileMentorshipSection({ form, onChange, isMentor, isPendingMentor, onStatusChange }: ProfileMentorshipSectionProps) {
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

  const approachFields = (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>{t("form.mentorshipApproachLabel")}</Label>
        <Textarea value={form.mentorship_approach} onChange={(e) => onChange({ mentorship_approach: e.target.value })} placeholder={t("form.mentorshipApproachPlaceholder")} />
      </div>
      <div className="space-y-1">
        <Label>{t("form.whatToExpectLabel")}</Label>
        <Textarea value={form.what_to_expect} onChange={(e) => onChange({ what_to_expect: e.target.value })} placeholder={t("form.whatToExpectPlaceholder")} />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <Card className="border-amber-100 bg-amber-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-amber-800 flex items-center gap-2 text-lg"><ShieldCheck className="h-5 w-5" /> {t("form.mentorshipStatus")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isMentor ? (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-green-700 flex items-center gap-2"><Check className="h-4 w-4" /> {t("form.activeMentor")}</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 gap-2"><UserMinus className="h-4 w-4" /> {t("form.stopMentorButton")}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("form.stopMentorTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("form.stopMentorDescription")}
                      <span className="block mt-2 font-bold text-red-600">{t("form.stopMentorWarning")}</span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => post("/api/profile/stop-mentor", undefined, "Você agora é apenas mentorado.")} className="bg-red-600">{t("form.stopMentorConfirm")}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : isPendingMentor ? (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm text-blue-700 font-medium">{t("form.pendingAnalysis")}</p>
                <p className="text-xs text-blue-600">{t("form.pendingAnalysisSubtitle")}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground flex-1">{t("form.becomeMentorPrompt")}</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" size="sm" className="gap-2 shrink-0"><UserPlus className="h-4 w-4" /> {t("form.becomeMentorButton")}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("form.becomeMentorTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>{t("form.becomeMentorDescription")}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-2">{approachFields}</div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("form.becomeMentorCancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => post("/api/profile/request-mentor", { mentorship_approach: form.mentorship_approach, what_to_expect: form.what_to_expect }, "Solicitação enviada!")}
                      disabled={!form.mentorship_approach.trim()}
                    >
                      {t("form.becomeMentorAction")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      </Card>

      {(isMentor || isPendingMentor) && (
        <Card>
          <CardHeader>
            <CardTitle>{t("form.mentorshipApproachTitle")}</CardTitle>
            <CardDescription>{t("form.mentorshipApproachDescription")}</CardDescription>
          </CardHeader>
          <CardContent>{approachFields}</CardContent>
        </Card>
      )}

      <TutorialsSection />
    </div>
  )
}
