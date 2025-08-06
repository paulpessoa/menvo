import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MailCheckIcon } from 'lucide-react'

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: { message: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-1">
          <MailCheckIcon className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <CardTitle className="text-3xl font-bold">Confirmação de E-mail</CardTitle>
          <CardDescription>
            {searchParams.message || 'Um link de confirmação foi enviado para o seu e-mail. Por favor, verifique sua caixa de entrada (e spam) para completar o cadastro.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Link href="/login" passHref>
            <Button className="w-full">Voltar para o Login</Button>
          </Link>
          <Link href="/" passHref>
            <Button variant="outline" className="w-full">Ir para a Página Inicial</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
