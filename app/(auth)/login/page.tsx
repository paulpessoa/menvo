'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { Loader2Icon, GithubIcon, ChromeIcon, LinkedinIcon } from 'lucide-react'
import { signInWithEmail, signInWithOAuth } from '@/services/auth/supabase'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

export default function LoginPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await signInWithEmail(email, password)

      if (error) {
        throw error
      }

      toast({
        title: t('login.toastSuccessTitle'),
        description: t('login.toastSuccessDescription'),
        variant: 'default',
      })
      router.push('/dashboard')
    } catch (error: any) {
      toast({
        title: t('login.toastErrorTitle'),
        description: error.message || t('login.toastErrorDescription'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'github' | 'google' | 'linkedin') => {
    setLoading(true)
    try {
      const { error } = await signInWithOAuth(provider)
      if (error) {
        throw error
      }
      // Supabase handles the redirect for OAuth, so no explicit router.push here
    } catch (error: any) {
      toast({
        title: t('login.toastOAuthErrorTitle'),
        description: error.message || t('login.toastOAuthErrorDescription'),
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
          <CardTitle className="text-2xl font-bold">{t('login.title')}</CardTitle>
          <CardDescription>{t('login.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Button variant="outline" className="w-full" onClick={() => handleOAuthSignIn('github')} disabled={loading}>
              {loading ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GithubIcon className="mr-2 h-4 w-4" />
              )}
              {t('login.signInWithGithub')}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => handleOAuthSignIn('google')} disabled={loading}>
              {loading ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ChromeIcon className="mr-2 h-4 w-4" />
              )}
              {t('login.signInWithGoogle')}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => handleOAuthSignIn('linkedin')} disabled={loading}>
              {loading ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LinkedinIcon className="mr-2 h-4 w-4" />
              )}
              {t('login.signInWithLinkedin')}
            </Button>
          </div>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t('login.orContinueWith')}
              </span>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('login.emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('login.passwordLabel')}</Label>
                <Link href="/forgot-password" passHref>
                  <Button variant="link" className="px-0 text-sm">
                    {t('login.forgotPasswordLink')}
                  </Button>
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  {t('login.loadingButton')}
                </>
              ) : (
                t('login.submitButton')
              )}
            </Button>
            <div className="mt-4 text-center text-sm">
              {t('login.noAccount')}{' '}
              <Link href="/signup" className="underline">
                {t('login.signupLink')}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
