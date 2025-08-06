import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SubmitButton } from '../login/submit-button'
import { UserPlusIcon } from 'lucide-react'

export default function Signup({
  searchParams,
}: {
  searchParams: { message: string }
}) {
  const signUp = async (formData: FormData) => {
    'use server'

    const origin = headers().get('origin')
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const supabase = createClient()

    if (password !== confirmPassword) {
      return redirect('/signup?message=Passwords do not match')
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    })

    if (error) {
      return redirect(`/signup?message=${error.message}`)
    }

    return redirect('/signup?message=Check email to continue signup process')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Cadastre-se</CardTitle>
          <CardDescription>
            Crie sua conta para começar sua jornada de mentoria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" action={signUp}>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" name="email" placeholder="m@example.com" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" name="password" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input id="confirmPassword" type="password" name="confirmPassword" required />
            </div>
            <SubmitButton
              className="w-full"
              pendingText="Cadastrando..."
            >
              <UserPlusIcon className="mr-2 h-4 w-4" />
              Cadastrar
            </SubmitButton>
            {searchParams?.message && (
              <p className="mt-4 p-4 text-center text-sm text-muted-foreground">
                {searchParams.message}
              </p>
            )}
            <div className="mt-4 text-center text-sm">
              Já tem uma conta?{' '}
              <Link className="underline" href="/login">
                Entrar
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
