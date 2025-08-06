import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SubmitButton } from './submit-button'
import { GithubIcon, GoogleIcon, LinkedinIcon } from '@/components/icons' // Assuming these are custom icons
import { Separator } from '@/components/ui/separator'

export default function Login({
  searchParams,
}: {
  searchParams: { message: string }
}) {
  const signIn = async (formData: FormData) => {
    'use server'

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return redirect(`/login?message=${error.message}`)
    }

    return redirect('/dashboard')
  }

  const signUp = async (formData: FormData) => {
    'use server'

    const origin = headers().get('origin')
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    })

    if (error) {
      return redirect(`/login?message=${error.message}`)
    }

    return redirect('/login?message=Check email to continue signup process')
  }

  const signInWithOAuth = async (provider: 'google' | 'github' | 'linkedin') => {
    'use server'
    const origin = headers().get('origin')
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    })

    if (error) {
      return redirect(`/login?message=${error.message}`)
    }

    return redirect(data.url)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Entrar</CardTitle>
          <CardDescription>
            Digite seu e-mail e senha ou use sua conta social.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-4">
              <form action={() => signInWithOAuth('google')}>
                <Button variant="outline" className="w-full" type="submit">
                  <GoogleIcon className="mr-2 h-4 w-4" />
                  Google
                </Button>
              </form>
              <form action={() => signInWithOAuth('github')}>
                <Button variant="outline" className="w-full" type="submit">
                  <GithubIcon className="mr-2 h-4 w-4" />
                  GitHub
                </Button>
              </form>
              <form action={() => signInWithOAuth('linkedin')}>
                <Button variant="outline" className="w-full" type="submit">
                  <LinkedinIcon className="mr-2 h-4 w-4" />
                  LinkedIn
                </Button>
              </form>
            </div>
            <Separator className="my-4" />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Ou continue com e-mail
                </span>
              </div>
            </div>
            <form className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" name="email" placeholder="m@example.com" required />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Senha</Label>
                  <Link
                    className="ml-auto inline-block text-sm underline"
                    href="/forgot-password"
                  >
                    Esqueceu sua senha?
                  </Link>
                </div>
                <Input id="password" type="password" name="password" required />
              </div>
              <SubmitButton formAction={signIn} className="w-full" pendingText="Entrando...">
                Entrar
              </SubmitButton>
              <SubmitButton formAction={signUp} className="w-full" variant="outline" pendingText="Cadastrando...">
                Cadastrar
              </SubmitButton>
            </form>
            {searchParams?.message && (
              <p className="mt-4 p-4 text-center text-sm text-muted-foreground">
                {searchParams.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
