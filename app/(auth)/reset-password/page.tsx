import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { SubmitButton } from '../login/submit-button'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { KeyRoundIcon } from 'lucide-react'

export default function ResetPassword({
  searchParams,
}: {
  searchParams: { message: string }
}) {
  const resetPassword = async (formData: FormData) => {
    'use server'

    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const supabase = createClient()

    if (password !== confirmPassword) {
      return redirect('/reset-password?message=Passwords do not match')
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      return redirect(`/reset-password?message=${error.message}`)
    }

    return redirect('/login?message=Your password has been reset successfully. You can now log in.')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Redefinir Senha</CardTitle>
          <CardDescription>
            Digite sua nova senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" action={resetPassword}>
            <div className="grid gap-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input id="password" type="password" name="password" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input id="confirmPassword" type="password" name="confirmPassword" required />
            </div>
            <SubmitButton
              className="w-full"
              pendingText="Redefinindo..."
            >
              <KeyRoundIcon className="mr-2 h-4 w-4" />
              Redefinir Senha
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
