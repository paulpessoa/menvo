'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { Loader2Icon } from 'lucide-react'
import { resetPassword } from '@/services/auth/supabase'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const accessToken = searchParams.get('access_token')

  useEffect(() => {
    if (!accessToken) {
      toast({
        title: t('resetPassword.noTokenTitle'),
        description: t('resetPassword.noTokenDescription'),
        variant: 'destructive',
      })
      router.push('/forgot-password')
    }
  }, [accessToken, router, toast, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (password !== confirmPassword) {
      toast({
        title: t('resetPassword.passwordMismatchTitle'),
        description: t('resetPassword.passwordMismatchDescription'),
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    try {
      const { error } = await resetPassword(password)

      if (error) {
        throw error
      }

      setMessage(t('resetPassword.successMessage'))
      toast({
        title: t('resetPassword.toastSuccessTitle'),
        description: t('resetPassword.toastSuccessDescription'),
        variant: 'default',
      })
      router.push('/login')
    } catch (error: any) {
      toast({
        title: t('resetPassword.toastErrorTitle'),
        description: error.message || t('resetPassword.toastErrorDescription'),
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
          <CardTitle className="text-2xl font-bold">{t('resetPassword.title')}</CardTitle>
          <CardDescription>{t('resetPassword.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t('resetPassword.newPasswordLabel')}</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t('resetPassword.confirmPasswordLabel')}</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  {t('resetPassword.loadingButton')}
                </>
              ) : (
                t('resetPassword.submitButton')
              )}
            </Button>
            {message && (
              <p className="text-center text-sm text-green-600">{message}</p>
            )}
            <div className="mt-4 text-center text-sm">
              <Link href="/login" className="underline">
                {t('resetPassword.backToLogin')}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
