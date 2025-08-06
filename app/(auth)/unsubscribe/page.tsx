import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { SubmitButton } from '../login/submit-button'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { MailXIcon } from 'lucide-react'

export default function UnsubscribePage({
  searchParams,
}: {
  searchParams: { message: string }
}) {
  const unsubscribe = async (formData: FormData) => {
    'use server'

    const email = formData.get('email') as string
    const supabase = createClient()

    // In a real application, you would have a more robust unsubscribe mechanism
    // that might involve a token or confirmation. For this example, we'll
    // simulate an unsubscribe.
    console.log(`Attempting to unsubscribe email: ${email}`)

    // Simulate a successful unsubscribe
    // In a real scenario, you'd update your newsletter database
    // const { error } = await supabase.from('newsletter_subscribers').delete().eq('email', email);
    // if (error) {
    //   return redirect(`/unsubscribe?message=${error.message}`);
    // }

    return redirect('/unsubscribe?message=Você foi desinscrito com sucesso.')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Desinscrever</CardTitle>
          <CardDescription>
            Digite seu e-mail para cancelar a inscrição da nossa newsletter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" action={unsubscribe}>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" name="email" placeholder="m@example.com" required />
            </div>
            <SubmitButton
              className="w-full"
              pendingText="Desinscrevendo..."
            >
              <MailXIcon className="mr-2 h-4 w-4" />
              Confirmar Desinscrição
            </SubmitButton>
            {searchParams?.message && (
              <p className="mt-4 p-4 text-center text-sm text-muted-foreground">
                {searchParams.message}
              </p>
            )}
            <div className="mt-4 text-center text-sm">
              <Link className="underline" href="/">
                Voltar para a Página Inicial
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
