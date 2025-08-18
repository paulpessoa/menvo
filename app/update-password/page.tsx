"use client"

import { useState, FormEvent, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/useToast"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

function UpdatePasswordForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
  const supabase = createClientComponentClient()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const searchParams = useSearchParams()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (password !== confirmPassword) {
      setError(t("updatePassword.passwordsDoNotMatch"))
      return
    }
    if (password.length < 6) {
      setError(t("updatePassword.passwordTooShort"))
      return
    }
    setError("")
    setIsSubmitting(true)

    // The user is redirected here from the password recovery email.
    // Supabase client will automatically handle the session from the URL hash.
    const { error: updateError } = await supabase.auth.updateUser({ password })

    setIsSubmitting(false)

    if (updateError) {
      toast({
        title: t("updatePassword.errorTitle"),
        description: updateError.message,
        variant: "destructive"
      })
    } else {
      toast({
        title: t("updatePassword.successTitle"),
        description: t("updatePassword.successDescription")
      })
      router.push("/dashboard")
    }
  }

  // Display error message from URL if present (e.g., from Supabase redirect)
  useEffect(() => {
    const errorDescription = searchParams.get("error_description")
    if (errorDescription) {
      setError(errorDescription)
    }
  }, [searchParams])

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t("updatePassword.title")}</CardTitle>
        <CardDescription>{t("updatePassword.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">{t("updatePassword.newPassword")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">
              {t("updatePassword.confirmPassword")}
            </Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("updatePassword.submitButton")}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function UpdatePasswordPage() {
  return (
    <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-16">
      <Suspense fallback={<div>Loading...</div>}>
        <UpdatePasswordForm />
      </Suspense>
    </div>
  )
}
