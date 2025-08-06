'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { Database } from '@/types/database'
import { UserRole } from '@/types/database'
import { UserTypeSelector } from '@/components/auth/UserTypeSelector'
import { GithubIcon, GoogleIcon, LinkedinIcon } from '@/components/icons' // Assuming these icons exist

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [userType, setUserType] = useState<UserRole>('mentee')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient<Database>()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          user_type: userType,
        },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Please check your email to confirm your account.',
      })
      router.push('/confirmation')
    }
    setIsLoading(false)
  }

  const handleOAuthSignIn = async (provider: 'google' | 'github' | 'linkedin') => {
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        queryParams: {
          user_type: userType, // Pass user type to the callback
        },
      },
    })

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
      setIsLoading(false)
    }
    // Supabase handles redirect, so no need to set isLoading(false) here on success
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Sign Up</CardTitle>
          <CardDescription>Create your account to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <UserTypeSelector selectedType={userType} onSelectType={setUserType} />
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  placeholder="John"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  placeholder="Doe"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing Up...' : 'Sign Up'}
            </Button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Button variant="outline" onClick={() => handleOAuthSignIn('google')} disabled={isLoading}>
              <GoogleIcon className="mr-2 h-4 w-4" />
              Google
            </Button>
            <Button variant="outline" onClick={() => handleOAuthSignIn('github')} disabled={isLoading}>
              <GithubIcon className="mr-2 h-4 w-4" />
              GitHub
            </Button>
            <Button variant="outline" onClick={() => handleOAuthSignIn('linkedin')} disabled={isLoading}>
              <LinkedinIcon className="mr-2 h-4 w-4" />
              LinkedIn
            </Button>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="underline" prefetch={false}>
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Placeholder icons - replace with actual SVG or component imports if needed
function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c2.8-.3 5.5-1.1 5.5-6v-1c0-.6-.2-1.2-.5-1.7.4-1.2.4-2.5 0-3.7 0 0-1 .3-2 .8-.6-.2-1.3-.3-2-.3s-1.4.1-2 .3c-1-.5-2-.8-2-.8-.4 1.2-.4 2.5 0 3.7-.3.5-.5 1.1-.5 1.7v1c0 4.9 2.7 5.7 5.5 6-.2.2-.4.5-.4.9v2.2" />
      <path d="M9 18c-3.3 0-6-2.7-6-6s2.7-6 6-6c1.3 0 2.5.4 3.5 1.1" />
    </svg>
  )
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <path d="M21.17 8H12" />
      <path d="M3.95 6.06L8.5 12l-4.55 5.94" />
      <path d="M12 3.95V12" />
      <path d="M12 21.17V12" />
    </svg>
  )
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}
