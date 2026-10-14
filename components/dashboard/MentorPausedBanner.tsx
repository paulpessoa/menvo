"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { useState } from "react"
import { toast } from "sonner"
import { Loader2, PauseCircle } from "lucide-react"

interface MentorPausedBannerProps {
  isPublic?: boolean | null
}

/**
 * Banner informativo exibido no topo da visão geral do mentor quando
 * suas mentorias estão pausadas (is_public: false).
 */
export function MentorPausedBanner({ isPublic }: MentorPausedBannerProps) {
  const { refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)

  if (isPublic) return null

  const handleReactivate = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_public: true }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Erro ao reativar mentorias")
      }

      await refreshProfile()
      toast.success("Mentorias reativadas! Seu perfil já está visível novamente no catálogo.")
    } catch (err) {
      console.error("[MentorPausedBanner] Erro:", err)
      toast.error(err instanceof Error ? err.message : "Erro ao reativar mentorias")
    } finally {
      setLoading(false)
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
            Suas mentorias estão temporariamente pausadas
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Seu perfil está oculto no catálogo público para novos mentorados, mas todos os seus horários e configurações continuam salvos.
          </p>
        </div>
      </div>
      <Button
        onClick={handleReactivate}
        disabled={loading}
        size="sm"
        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shrink-0 shadow-xs active:scale-[0.98]"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reativar mentorias"}
      </Button>
    </div>
  )
}
