'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { unsubscribeFromNewsletter } from '@/services/newsletter/newsletter' // Assuming this service exists
import Link from 'next/link'

export default function UnsubscribePage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [unsubscribed, setUnsubscribed] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Pre-fill email if provided in URL (e.g., from an unsubscribe link)
  useState(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Call your unsubscribe service
      const { error } = await unsubscribeFromNewsletter(email)
      if (error) {
        throw error
      }
      setUnsubscribed(true)
      toast({
        title: 'Inscrição cancelada!',
        description: 'Você foi removido da nossa lista de e-mails com sucesso.',
        variant: 'default',
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao cancelar inscrição',
        description: error.message || 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Cancelar Inscrição</CardTitle>
          <CardDescription>
            {unsubscribed
              ? 'Sua inscrição foi cancelada com sucesso.'
              : 'Digite seu email para cancelar sua inscrição em nossa newsletter.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {unsubscribed ? (
            <div className="text-center space-y-4">
              <p>Você não receberá mais e-mails de marketing de nós.</p>
              <Link href="/" passHref>
                <Button>Voltar para a Página Inicial</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Processando...' : 'Cancelar Inscrição'}
              </Button>
            </form>
          )}
        </CardContent>
        {!unsubscribed && (
          <CardFooter className="flex justify-center">
            <Link href="/" className="text-sm text-blue-600 hover:underline">
              Voltar para a Página Inicial
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
