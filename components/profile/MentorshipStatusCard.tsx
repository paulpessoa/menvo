"use client"

import { AlertCircle, Check, ShieldCheck, UserMinus, UserPlus } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { MentorApproachFields } from "./MentorApproachFields"
import type { ProfileFormData, ProfileFormPatch } from "./profile-form"

interface MentorshipStatusCardProps {
  form: ProfileFormData
  onChange: ProfileFormPatch
  isMentor: boolean
  isPendingMentor: boolean
  verificationStatus?: string | null
  /** POSTs to one of the mentorship endpoints, shows the toast and refreshes the status. */
  onAction: (path: string, body: object | undefined, successMessage: string) => Promise<void>
}

/** Mentor status in the "Mentoria" tab: active (with stop), pending / changes requested, or the "become a mentor" dialog. */
export function MentorshipStatusCard({ form, onChange, isMentor, isPendingMentor, verificationStatus, onAction }: MentorshipStatusCardProps) {
  const t = useTranslations("profile")
  const tCommon = useTranslations("common")

  return (
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
                  <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onAction("/api/profile/stop-mentor", undefined, "Você agora é apenas mentorado.")} className="bg-red-600">{t("form.stopMentorConfirm")}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : isPendingMentor ? (
          verificationStatus === "changes_requested" ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm text-amber-800 dark:text-amber-300 font-semibold">Ajustes solicitados pelo administrador</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  Nossa equipe revisou sua candidatura e solicitou alguns ajustes. Por favor, confira as orientações enviadas no seu e-mail, atualize suas informações e clique em <strong>Salvar perfil</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm text-blue-700 font-medium">{t("form.pendingAnalysis")}</p>
                <p className="text-xs text-blue-600">{t("form.pendingAnalysisSubtitle")}</p>
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground flex-1">{t("form.becomeMentorPrompt")}</p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" size="sm" className="gap-2 shrink-0"><UserPlus className="h-4 w-4" /> {t("form.becomeMentorButton")}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("form.becomeMentorTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("form.becomeMentorDescription")}</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-2"><MentorApproachFields form={form} onChange={onChange} /></div>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("form.becomeMentorCancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onAction("/api/profile/request-mentor", { mentorship_approach: form.mentorship_approach, what_to_expect: form.what_to_expect }, "Solicitação enviada!")}
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
  )
}
