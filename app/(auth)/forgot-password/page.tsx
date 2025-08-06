'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { Loader2Icon } from 'lucide-react'
import { sendPasswordResetEmail } from '@/services/auth/supabase'
import { useTranslation } from 'react-i18next'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await sendPasswordResetEmail(email)

      if (error) {
        throw error
      }

      setMessage(t('forgotPassword.successMessage'))
      toast({
        title: t('forgotPassword.toastSuccessTitle'),
        description: t('forgotPassword.toastSuccessDescription'),
        variant: 'default',
      })
    } catch (error: any) {
      toast({
        title: t('forgotPassword.toastErrorTitle'),
        description: error.message || t('forgotPassword.toastErrorDescription'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">{t('forgotPassword.title')}</CardTitle>
          <CardDescription>{t('forgotPassword.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('forgotPassword.emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  {t('forgotPassword.loadingButton')}
                </>
              ) : (
                t('forgotPassword.submitButton')
              )}
            </Button>
            {message && (
              <p className="text-center text-sm text-green-600">{message}</p>
            )}
            <div className="mt-4 text-center text-sm">
              {t('forgotPassword.rememberPassword')}{' '}
              <Link href="/login" className="underline">
                {t('forgotPassword.loginLink')}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
