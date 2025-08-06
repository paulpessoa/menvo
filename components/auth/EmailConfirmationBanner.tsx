'use client'

import { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { MailCheckIcon, XIcon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { resendConfirmationEmail } from '@/services/auth/supabase' // Assuming this function exists
import { toast } from '@/components/ui/use-toast'

export function EmailConfirmationBanner() {
  const { user, loading } = useAuth()
  const [showBanner, setShowBanner] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (!loading && user && !user.email_confirmed_at) {
      setShowBanner(true)
    } else {
      setShowBanner(false)
    }
  }, [user, loading])

  const handleResend = async () => {
    if (!user?.email) return

    setResending(true)
    try {
      const { error } = await resendConfirmationEmail(user.email)
      if (error) {
        throw error
      }
      toast({
        title: 'Email de confirmação reenviado!',
        description: 'Verifique sua caixa de entrada (e spam) para o novo link.',
        variant: 'default',
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao reenviar email',
        description: error.message || 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setResending(false)
    }
  }

  if (!showBanner) {
    return null
  }

  return (
    <Alert className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-md bg-yellow-500 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MailCheckIcon className="h-5 w-5" />
          <AlertTitle>Confirme seu Email!</AlertTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowBanner(false)} className="text-white hover:bg-yellow-600">
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </Button>
      </div>
      <AlertDescription className="mt-2 text-sm">
        Seu email ainda não foi verificado. Por favor, clique no link que enviamos para {user?.email}.
        <Button
          variant="link"
          onClick={handleResend}
          disabled={resending}
          className="p-0 h-auto text-white underline hover:no-underline ml-2"
        >
          {resending ? 'Reenviando...' : 'Reenviar Email'}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
