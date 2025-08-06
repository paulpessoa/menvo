'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle2Icon, XCircleIcon, Loader2Icon } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { supabase } from '@/services/auth/supabase' // Assuming supabase client is exported

export default function VerificationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verificando seu email...')

  useEffect(() => {
    const verifyEmail = async () => {
      const type = searchParams.get('type')
      const token_hash = searchParams.get('token_hash')

      if (type === 'signup' && token_hash) {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'email',
          })

          if (error) {
            throw error
          }

          // After successful verification, update the user's profile to mark email as confirmed
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          if (userError || !user) {
            throw userError || new Error('Could not retrieve user after verification.')
          }

          const { error: profileUpdateError } = await supabase
            .from('user_profiles')
            .update({ email_confirmed: true })
            .eq('id', user.id)

          if (profileUpdateError) {
            throw profileUpdateError
          }

          setStatus('success')
          setMessage('Seu email foi verificado com sucesso! Você será redirecionado em breve.')
          toast({
            title: 'Email Verificado!',
            description: 'Sua conta foi ativada com sucesso.',
            variant: 'default',
          })
          setTimeout(() => {
            router.push('/welcome') // Redirect to welcome/onboarding page
          }, 3000)
        } catch (error: any) {
          setStatus('error')
          setMessage(`Erro na verificação: ${error.message || 'Ocorreu um erro inesperado.'}`)
          toast({
            title: 'Erro na Verificação',
            description: error.message || 'Não foi possível verificar seu email.',
            variant: 'destructive',
          })
        }
      } else {
        setStatus('error')
        setMessage('Link de verificação inválido ou incompleto.')
        toast({
          title: 'Link Inválido',
          description: 'O link de verificação está faltando informações.',
          variant: 'destructive',
        })
      }
    }

    verifyEmail()
  }, [searchParams, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          {status === 'loading' && <Loader2Icon className="mx-auto h-12 w-12 animate-spin text-blue-500" />}
          {status === 'success' && <CheckCircle2Icon className="mx-auto h-12 w-12 text-green-500" />}
          {status === 'error' && <XCircleIcon className="mx-auto h-12 w-12 text-red-500" />}
          <CardTitle className="text-2xl font-bold mt-4">
            {status === 'loading' && 'Verificando...'}
            {status === 'success' && 'Verificação Concluída!'}
            {status === 'error' && 'Erro na Verificação'}
          </CardTitle>
          <CardDescription className="mt-2">{message}</CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'error' && (
            <div className="mt-4">
              <Link href="/signup" passHref>
                <Button>Tentar novamente</Button>
              </Link>
            </div>
          )}
          {status === 'success' && (
            <div className="mt-4">
              <p>Você será redirecionado para a página de boas-vindas em breve.</p>
              <p>Se não for redirecionado, clique no botão abaixo.</p>
              <Link href="/welcome" passHref>
                <Button className="mt-2">Ir para a Página de Boas-Vindas</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
