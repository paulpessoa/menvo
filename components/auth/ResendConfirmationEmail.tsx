'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { resendConfirmationEmail } from '@/services/auth/supabase' // Assuming this function exists
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ResendConfirmationEmail() {
  const [email, setEmail] = useState('')
  const [resending, setResending] = useState(false)

  const handleResend = async () => {
    if (!email) {
      toast({
        title: 'Email necessário',
        description: 'Por favor, digite seu email para reenviar o link de confirmação.',
        variant: 'destructive',
      })
      return
    }

    setResending(true)
    try {
      const { error } = await resendConfirmationEmail(email)
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

  return (
    <div className="space-y-4 mt-6 p-4 border rounded-lg bg-muted/50">
      <p className="text-sm text-muted-foreground">
        Não recebeu o email de confirmação? Digite seu email abaixo para reenviar.
      </p>
      <div className="grid gap-2">
        <Label htmlFor="resend-email">Seu Email</Label>
        <Input
          id="resend-email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={resending}
        />
      </div>
      <Button onClick={handleResend} disabled={resending} className="w-full">
        {resending ? 'Reenviando...' : 'Reenviar Email de Confirmação'}
      </Button>
    </div>
  )
}
