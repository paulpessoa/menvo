"use client"

import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Clock, X } from "lucide-react"

export function VerificationPendingBanner() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <Alert className="border-blue-200 bg-blue-50 text-blue-800">
      <Clock className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between w-full">
        <span>Seu perfil de mentor está em análise. Você será notificado quando for aprovado.</span>
        <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  )
}
