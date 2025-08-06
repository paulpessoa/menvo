import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { MailCheckIcon } from 'lucide-react'
import { ResendConfirmationEmail } from '@/components/auth/ResendConfirmationEmail'

export default function ConfirmationPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <MailCheckIcon className="mx-auto h-12 w-12 text-green-500" />
          <CardTitle className="text-2xl font-bold mt-4">Verifique seu Email</CardTitle>
          <CardDescription className="mt-2">
            Um link de confirmação foi enviado para o seu endereço de email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg">
            Por favor, verifique sua caixa de entrada (e a pasta de spam) para ativar sua conta.
          </p>
          <p className="text-muted-foreground">
            O link de confirmação expira em breve.
          </p>
          <ResendConfirmationEmail />
          <div className="mt-4">
            <Link href="/login" passHref>
              <Button variant="outline">Voltar para o Login</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
