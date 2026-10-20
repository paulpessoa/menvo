"use client"

import { Button } from "@/components/ui/button"
import { useUpdateProfile } from "@/hooks/profile/useUpdateProfile"
import { toast } from "sonner"
import { Loader2, PauseCircle } from "lucide-react"

interface MentorPausedBannerProps {
  isPublic?: boolean | null
}

/**
 * Banner exibido no topo da visão geral do mentor quando o perfil está fora
 * do catálogo (is_public: false). O texto é neutro de propósito: o mesmo
 * estado vem tanto de "Pausar mentorias" quanto de um mentor que nunca ligou
 * o perfil público, e dizer "pausadas" para quem não pausou confundia.
 */
export function MentorPausedBanner({ isPublic }: MentorPausedBannerProps) {
  const { mutateAsync: updateProfile, isPending: loading } = useUpdateProfile()

  if (isPublic) return null

  const handleReactivate = async () => {
    try {
      await updateProfile({ is_public: true })
      toast.success("Pronto! Seu perfil já aparece no catálogo de mentores.")
    } catch (err) {
      console.error("[MentorPausedBanner] Erro:", err)
      toast.error(err instanceof Error ? err.message : "Erro ao reativar mentorias")
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-amber-500/10 border border-amber-500/30 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
      <div className="flex items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
          <PauseCircle className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground">
            Seu perfil não aparece no catálogo
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mentorados não conseguem te encontrar nem agendar com você. Seus horários e configurações continuam salvos.
          </p>
        </div>
      </div>
      <Button
        onClick={handleReactivate}
        disabled={loading}
        size="sm"
        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shrink-0 shadow-xs active:scale-[0.98]"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aparecer no catálogo"}
      </Button>
    </div>
  )
}
