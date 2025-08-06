import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { SubmitButton } from '../login/submit-button'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MailIcon } from 'lucide-react'

export default function ForgotPassword({
  searchParams,
}: {
  searchParams: { message: string }
}) {
  const forgotPassword = async (formData: FormData) => {
    'use server'

    const origin = headers().get('origin')
    const email = formData.get('email') as string
    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    })

    if (error) {
      return redirect(`/forgot-password?message=${error.message}`)
    }

    return redirect('/forgot-password?message=Check email to reset password')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Esqueceu a Senha?</CardTitle>
          <CardDescription>
            Digite seu e-mail para receber um link de redefinição de senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" action={forgotPassword}>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" name="email" placeholder="m@example.com" required />
            </div>
            <SubmitButton
              className="w-full"
              pendingText="Enviando..."
            >
              <MailIcon className="mr-2 h-4 w-4" />
              Enviar Link de Redefinição
            </SubmitButton>
            {searchParams?.message && (
              <p className="mt-4 p-4 text-center text-sm text-muted-foreground">
                {searchParams.message}
              </p>
            )}
            <div className="mt-4 text-center text-sm">
              <Link className="underline" href="/login">
                Voltar para o Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
