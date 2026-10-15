"use client"

import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/routing"
import { AlertCircle, FileEdit } from "lucide-react"

interface MentorChangesRequestedBannerProps {
  verificationStatus?: string | null
}

/**
 * Banner exibido no dashboard quando a candidatura a mentor tem o status
 * `changes_requested`. Avisa o usuário de forma amigável e fornece atalho
 * direto para revisar os dados na aba de mentoria do perfil.
 */
export function MentorChangesRequestedBanner({ verificationStatus }: MentorChangesRequestedBannerProps) {
  if (verificationStatus !== "changes_requested") return null

  return (
    <div
      data-testid="mentor-changes-requested-banner"
      className="relative overflow-hidden rounded-2xl bg-amber-500/10 border border-amber-500/30 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
    >
      <div className="flex items-start sm:items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground">
            Ajustes solicitados na sua candidatura a mentor
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Nossa equipe analisou seu perfil e solicitou alguns ajustes antes da aprovação. Confira as orientações enviadas no seu e-mail e atualize as informações necessárias.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
        <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-xs">
          <Link href="/profile?tab=mentorship">
            <FileEdit className="h-4 w-4 mr-2" />
            Revisar perfil
          </Link>
        </Button>
      </div>
    </div>
  )
}
