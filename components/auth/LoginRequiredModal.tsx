"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LogIn, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"

interface LoginRequiredModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
}

export function LoginRequiredModal({
  isOpen,
  onClose,
  title = "Login Necessário",
  description = "Você precisa estar logado para acessar esta funcionalidade.",
}: LoginRequiredModalProps) {
  const router = useRouter()

  const handleLogin = () => {
    onClose()
    router.push("/login")
  }

  const handleSignup = () => {
    onClose()
    router.push("/signup")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center mb-4">
            <LogIn className="h-6 w-6 text-blue-600" />
          </div>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <h4 className="font-semibold mb-2">Benefícios de ter uma conta:</h4>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Acesso a mentores verificados</li>
              <li>Agendamento de sessões</li>
              <li>Histórico de mentorias</li>
              <li>Perfil personalizado</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handleLogin} className="w-full">
              <LogIn className="h-4 w-4 mr-2" />
              Fazer Login
            </Button>
            <Button variant="outline" onClick={handleSignup} className="w-full bg-transparent">
              <UserPlus className="h-4 w-4 mr-2" />
              Criar Conta
            </Button>
          </div>

          <Button variant="ghost" onClick={onClose} className="w-full">
            Continuar sem login
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
