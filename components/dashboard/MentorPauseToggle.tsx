"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/lib/auth"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface MentorPauseToggleProps {
  isPublic?: boolean | null
  className?: string
}

/**
 * Controle de pausa/reativação de mentorias (C-T4).
 * Permite que o mentor voluntário pause temporariamente sua presença no
 * catálogo público (is_public: false) sem ter que apagar seus horários configurados.
 */
export function MentorPauseToggle({ isPublic = true, className }: MentorPauseToggleProps) {
  const { refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleToggle = async (newStatus: boolean) => {
    try {
      setLoading(true)
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_public: newStatus }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Erro ao atualizar status das mentorias")
      }

      await refreshProfile()

      if (newStatus) {
        toast.success("Mentorias reativadas! Seu perfil já está visível novamente no catálogo.")
      } else {
        toast.success("Mentorias pausadas. Seu perfil foi temporariamente ocultado do catálogo.")
      }
      setDialogOpen(false)
    } catch (err) {
      console.error("[MentorPauseToggle] Erro:", err)
      toast.error(err instanceof Error ? err.message : "Erro ao alterar visibilidade")
    } finally {
      setLoading(false)
    }
  }

  if (!isPublic) {
    return (
      <Button
        size="sm"
        onClick={() => handleToggle(true)}
        disabled={loading}
        className="rounded-xl font-bold h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-[0.98]"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reativar mentorias"}
      </Button>
    )
  }

  return (
    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          className="rounded-xl font-medium h-10 px-4 border-2 border-border bg-background hover:bg-muted/60 active:scale-[0.98] text-muted-foreground hover:text-foreground"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pausar mentorias"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Pausar suas mentorias temporariamente?</AlertDialogTitle>
          <AlertDialogDescription>
            Seu perfil deixará de aparecer no catálogo público e nas buscas de mentores.
            Nenhum dos seus horários ou sessões agendadas será apagado. Você poderá reativar
            a qualquer momento com apenas um clique.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => handleToggle(false)}
            className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium"
          >
            Confirmar pausa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
