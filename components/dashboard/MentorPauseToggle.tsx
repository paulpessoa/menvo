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
import { useUpdateProfile } from "@/hooks/profile/useUpdateProfile"
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
  const { mutateAsync: updateProfile, isPending: loading } = useUpdateProfile()
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleToggle = async (newStatus: boolean) => {
    try {
      // Salvar, invalidar o catálogo e recarregar o perfil da sessão: tudo no hook.
      await updateProfile({ is_public: newStatus })

      if (newStatus) {
        toast.success("Pronto! Seu perfil já aparece no catálogo de mentores.")
      } else {
        toast.success("Mentorias pausadas. Seu perfil foi temporariamente ocultado do catálogo.")
      }
      setDialogOpen(false)
    } catch (err) {
      console.error("[MentorPauseToggle] Erro:", err)
      toast.error(err instanceof Error ? err.message : "Erro ao alterar visibilidade")
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
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aparecer no catálogo"}
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
