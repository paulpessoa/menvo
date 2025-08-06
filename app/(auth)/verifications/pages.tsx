import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircleIcon, XCircleIcon } from 'lucide-react'

export default async function VerificationsPage({
  searchParams,
}: {
  searchParams: { token: string; type: string; error: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let message = ''
  let isSuccess = false

  if (searchParams.error) {
    message = `Erro na verificação: ${searchParams.error}`
    isSuccess = false
  } else if (user) {
    message = 'Seu e-mail foi verificado com sucesso!'
    isSuccess = true
  } else {
    message = 'Link de verificação inválido ou expirado.'
    isSuccess = false
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          {isSuccess ? (
            <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500 mb-4" />
          ) : (
            <XCircleIcon className="mx-auto h-16 w-16 text-red-500 mb-4" />
          )}
          <CardTitle className="text-3xl font-bold">Status da Verificação</CardTitle>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {isSuccess ? (
            <Link href="/dashboard" passHref>
              <Button className="w-full">Ir para o Painel</Button>
            </Link>
          ) : (
            <Link href="/login" passHref>
              <Button className="w-full" variant="outline">Tentar Novamente</Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
