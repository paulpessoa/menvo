'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { Loader2Icon, GithubIcon, ChromeIcon, LinkedinIcon } from 'lucide-react'
import { signUpWithEmail, signInWithOAuth } from '@/services/auth/supabase'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { UserTypeSelector } from '@/components/auth/UserTypeSelector'
import { user_role } from '@/types/database'

export default function SignupPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<user_role>('mentee') // Default role
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (password !== confirmPassword) {
      toast({
        title: t('signup.passwordMismatchTitle'),
        description: t('signup.passwordMismatchDescription'),
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    try {
      const { error } = await signUpWithEmail(email, password, role)

      if (error) {
        throw error
      }

      toast({
        title: t('signup.toastSuccessTitle'),
        description: t('signup.toastSuccessDescription'),
        variant: 'default',
      })
      router.push('/confirmation') // Redirect to a confirmation page
    } catch (error: any) {
      toast({
        title: t('signup.toastErrorTitle'),
        description: error.message || t('signup.toastErrorDescription'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'github' | 'google' | 'linkedin') => {
    setLoading(true)
    try {
      const { error } = await signInWithOAuth(provider, role)
      if (error) {
        throw error
      }
      // Supabase handles the redirect for OAuth, so no explicit router.push here
    } catch (error: any) {
      toast({
        title: t('signup.toastOAuthErrorTitle'),
        description: error.message || t('signup.toastOAuthErrorDescription'),
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
          <CardTitle className="text-2xl font-bold">{t('signup.title')}</CardTitle>
          <CardDescription>{t('signup.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <UserTypeSelector selectedRole={role} onSelectRole={setRole} disabled={loading} />
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t('signup.orContinueWith')}
              </span>
            </div>
          </div>
          <div className="grid gap-4">
            <Button variant="outline" className="w-full" onClick={() => handleOAuthSignIn('github')} disabled={loading}>
              {loading ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GithubIcon className="mr-2 h-4 w-4" />
              )}
              {t('signup.signUpWithGithub')}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => handleOAuthSignIn('google')} disabled={loading}>
              {loading ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ChromeIcon className="mr-2 h-4 w-4" />
              )}
              {t('signup.signUpWithGoogle')}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => handleOAuthSignIn('linkedin')} disabled={loading}>
              {loading ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LinkedinIcon className="mr-2 h-4 w-4" />
              )}
              {t('signup.signUpWithLinkedin')}
            </Button>
          </div>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t('signup.orSignUpWithEmail')}
              </span>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('signup.emailLabel')}</Label>
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
              <Label htmlFor="password">{t('signup.passwordLabel')}</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t('signup.confirmPasswordLabel')}</Label>
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
                  {t('signup.loadingButton')}
                </>
              ) : (
                t('signup.submitButton')
              )}
            </Button>
            <div className="mt-4 text-center text-sm">
              {t('signup.alreadyHaveAccount')}{' '}
              <Link href="/login" className="underline">
                {t('signup.loginLink')}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
