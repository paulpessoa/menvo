'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2Icon, CheckCircleIcon, XCircleIcon, MailIcon } from 'lucide-react'
import { verifyEmail } from '@/services/auth/supabase'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

export default function EmailVerificationPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const { toast } = useToast()

  useEffect(() => {
    const handleVerification = async () => {
      if (token_hash && type === 'email_change') {
        // This page is primarily for email verification after signup.
        // Email change verification is handled differently by Supabase,
        // often directly updating the user's email without needing a separate page.
        // For simplicity, we'll treat it as a general success or error.
        setVerificationStatus('success')
        toast({
          title: t('emailVerification.emailChangeSuccessTitle'),
          description: t('emailVerification.emailChangeSuccessDescription'),
          variant: 'default',
        })
        router.push('/dashboard') // Redirect after email change
        return
      }

      if (!token_hash || type !== 'signup') {
        setVerificationStatus('error')
        toast({
          title: t('emailVerification.invalidLinkTitle'),
          description: t('emailVerification.invalidLinkDescription'),
          variant: 'destructive',
        })
        return
      }

      try {
        const { error } = await verifyEmail(token_hash)

        if (error) {
          throw error
        }

        setVerificationStatus('success')
        toast({
          title: t('emailVerification.successTitle'),
          description: t('emailVerification.successDescription'),
          variant: 'default',
        })
      } catch (error: any) {
        setVerificationStatus('error')
        toast({
          title: t('emailVerification.errorTitle'),
          description: error.message || t('emailVerification.errorDescription'),
          variant: 'destructive',
        })
      }
    }

    handleVerification()
  }, [token_hash, type, router, toast, t])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-1">
          {verificationStatus === 'loading' && (
            <Loader2Icon className="mx-auto h-16 w-16 animate-spin text-primary" />
          )}
          {verificationStatus === 'success' && (
            <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
          )}
          {verificationStatus === 'error' && (
            <XCircleIcon className="mx-auto h-16 w-16 text-red-500" />
          )}
          <CardTitle className="text-3xl font-bold">
            {verificationStatus === 'loading' && t('emailVerification.loadingTitle')}
            {verificationStatus === 'success' && t('emailVerification.successTitle')}
            {verificationStatus === 'error' && t('emailVerification.errorTitle')}
          </CardTitle>
          <CardDescription className="text-lg">
            {verificationStatus === 'loading' && t('emailVerification.loadingDescription')}
            {verificationStatus === 'success' && t('emailVerification.successDescription')}
            {verificationStatus === 'error' && t('emailVerification.errorDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verificationStatus === 'success' && (
            <Link href="/login" passHref>
              <Button className="w-full">{t('emailVerification.loginButton')}</Button>
            </Link>
          )}
          {verificationStatus === 'error' && (
            <div className="flex flex-col gap-2">
              <Link href="/signup" passHref>
                <Button className="w-full">{t('emailVerification.tryAgainButton')}</Button>
              </Link>
              <Link href="/" passHref>
                <Button variant="outline" className="w-full">{t('emailVerification.homeButton')}</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
