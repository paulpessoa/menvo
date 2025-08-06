"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, Mail, CheckCircle } from 'lucide-react'
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import { ResendConfirmationEmail } from "./ResendConfirmationEmail"

export function EmailConfirmationBanner() {
  const { user, loading } = useAuth()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!loading && user && !user.email_confirmed_at) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [user, loading])

  const handleClose = () => {
    setIsVisible(false)
  }

  if (!isVisible) {
    return null
  }

  return (
    <Card className="bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200 rounded-lg shadow-md">
      <CardContent className="p-4 flex items-start justify-between text-sm">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Confirme seu endereço de e-mail!</p>
            <p className="text-xs mt-1">
              Um link de verificação foi enviado para <strong>{user?.email}</strong>. Por favor, clique no link para ativar sua conta.
            </p>
            <div className="mt-2">
              <ResendConfirmationEmail email={user?.email || ""} />
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleClose} className="text-blue-800 dark:text-blue-200 hover:bg-blue-200/50 dark:hover:bg-blue-800/50">
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar banner</span>
        </Button>
      </CardContent>
    </Card>
  )
}
