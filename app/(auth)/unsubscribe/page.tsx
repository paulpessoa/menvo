'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { Loader2Icon, MailXIcon, CheckCircleIcon } from 'lucide-react'
import { unsubscribeFromNewsletter } from '@/services/newsletter/newsletter'
import { useTranslation } from 'react-i18next'

export default function UnsubscribePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailParam = searchParams.get('email')

  const [email, setEmail] = useState(emailParam || '')
  const [loading, setLoading] = useState(false)
  const [unsubscribed, setUnsubscribed] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await unsubscribeFromNewsletter(email)

      if (error) {
        throw error
      }

      setUnsubscribed(true)
      toast({
        title: t('unsubscribe.toastSuccessTitle'),
        description: t('unsubscribe.toastSuccessDescription'),
        variant: 'default',
      })
    } catch (error: any) {
      toast({
        title: t('unsubscribe.toastErrorTitle'),
        description: error.message || t('unsubscribe.toastErrorDescription'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-1">
          {unsubscribed ? (
            <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
          ) : (
            <MailXIcon className="mx-auto h-16 w-16 text-red-500" />
          )}
          <CardTitle className="text-3xl font-bold">
            {unsubscribed ? t('unsubscribe.successTitle') : t('unsubscribe.title')}
          </CardTitle>
          <CardDescription className="text-lg">
            {unsubscribed ? t('unsubscribe.successDescription') : t('unsubscribe.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {unsubscribed ? (
            <Button onClick={() => router.push('/')} className="w-full">
              {t('unsubscribe.backToHome')}
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('unsubscribe.emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    {t('unsubscribe.loadingButton')}
                  </>
                ) : (
                  t('unsubscribe.submitButton')
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
