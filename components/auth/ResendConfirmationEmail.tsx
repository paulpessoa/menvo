"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import { Loader2, Mail } from 'lucide-react'

interface ResendConfirmationEmailProps {
  email?: string
}

export function ResendConfirmationEmail({ email }: ResendConfirmationEmailProps) {
  const { resendConfirmationEmail } = useAuth()
  const { toast } = useToast()
  const [isSending, setIsSending] = useState(false)

  const handleResend = async () => {
    if (!email) {
      toast({
        title: "E-mail não fornecido",
        description: "Não foi possível reenviar o e-mail de confirmação sem um endereço de e-mail.",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    try {
      const { error } = await resendConfirmationEmail(email)
      if (error) {
        throw error
      }
      toast({
        title: "E-mail reenviado!",
        description: "Um novo e-mail de confirmação foi enviado para sua caixa de entrada.",
        variant: "default",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao reenviar e-mail",
        description: error.message || "Não foi possível reenviar o e-mail. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Button
      onClick={handleResend}
      disabled={isSending}
      variant="link"
      className="p-0 h-auto text-sm"
    >
      {isSending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Reenviando...
        </>
      ) : (
        <>
          <Mail className="mr-2 h-4 w-4" />
          Reenviar e-mail de confirmação
        </>
      )}
    </Button>
  )
}
