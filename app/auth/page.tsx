import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LogInIcon, UserPlusIcon } from 'lucide-react'

export default async function AuthPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold">Bem-vindo ao Mentor Connect</CardTitle>
          <CardDescription>
            Conecte-se com mentores e mentees para impulsionar seu crescimento.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Link href="/login" passHref>
            <Button className="w-full">
              <LogInIcon className="mr-2 h-4 w-4" />
              Entrar
            </Button>
          </Link>
          <Link href="/signup" passHref>
            <Button variant="outline" className="w-full">
              <UserPlusIcon className="mr-2 h-4 w-4" />
              Cadastre-se
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
