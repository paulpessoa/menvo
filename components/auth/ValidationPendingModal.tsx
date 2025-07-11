"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"

interface ValidationPendingModalProps {
  isOpen: boolean
  onClose?: () => void
}

export function ValidationPendingModal({ isOpen, onClose }: ValidationPendingModalProps) {
  const { user, hasRole } = useAuth()
  const router = useRouter()

  const getStatusInfo = () => {
    if (!user) return null

    switch (user.verification_status) {
      case "pending":
        return {
          icon: Clock,
          title: "Verificação em Andamento",
          description: "Sua candidatura está sendo analisada pela nossa equipe.",
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
        }
      case "approved":
        return {
          icon: CheckCircle,
          title: "Verificação Aprovada!",
          description: "Parabéns! Você foi aprovado como mentor.",
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        }
      case "rejected":
        return {
          icon: AlertCircle,
          title: "Verificação Rejeitada",
          description: "Sua candidatura não foi aprovada. Veja os detalhes no seu perfil.",
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        }
      default:
        return null
    }
  }

  const statusInfo = getStatusInfo()
  if (!statusInfo) return null

  const Icon = statusInfo.icon

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div
            className={`mx-auto w-12 h-12 rounded-full ${statusInfo.bgColor} ${statusInfo.borderColor} border-2 flex items-center justify-center mb-4`}
          >
            <Icon className={`h-6 w-6 ${statusInfo.color}`} />
          </div>
          <DialogTitle className="text-center">{statusInfo.title}</DialogTitle>
          <DialogDescription className="text-center">{statusInfo.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {user.verification_status === "pending" && (
            <div className={`p-4 rounded-lg ${statusInfo.bgColor} ${statusInfo.borderColor} border`}>
              <h4 className="font-semibold mb-2">O que acontece agora?</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Nossa equipe analisará seu perfil e vídeo</li>
                <li>O processo pode levar até 3 dias úteis</li>
                <li>Você receberá um email com o resultado</li>
                <li>Enquanto isso, você pode usar outras funcionalidades</li>
              </ul>
            </div>
          )}

          {user.verification_status === "rejected" && (
            <div className={`p-4 rounded-lg ${statusInfo.bgColor} ${statusInfo.borderColor} border`}>
              <h4 className="font-semibold mb-2">Próximos passos:</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Revise o feedback em seu perfil</li>
                <li>Faça as melhorias sugeridas</li>
                <li>Reenvie sua candidatura</li>
              </ul>
            </div>
          )}

          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => router.push("/profile")}>
              Ver Perfil
            </Button>
            {user.verification_status === "approved" && (
              <Button onClick={() => router.push("/dashboard")}>Ir para Dashboard</Button>
            )}
            {onClose && (
              <Button variant="ghost" onClick={onClose}>
                Continuar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
