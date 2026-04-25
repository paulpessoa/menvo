"use client"

import type React from "react"

import { useState, Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Mail, Loader2, AlertTriangle, CheckCircle } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { createClient } from "@/lib/utils/supabase/client"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword")
  const tLogin = useTranslations("login")
  const tc = useTranslations("common")
  const auth = useAuth()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })

      if (error) throw error

      setIsSubmitting(true)
      toast.success(t("success"))
    } catch (err: any) {
      console.error("Error resetting password:", err)
      const message = auth.handleAuthError(err)
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="text-center pt-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">{t("success")}</CardTitle>
          <CardDescription className="px-6 text-base">
            {t("description")}
          </CardDescription>
        </CardHeader>
        <CardFooter className="pb-12 pt-6 px-10">
          <Button asChild variant="outline" className="w-full h-12 rounded-xl border-2 font-bold hover:bg-muted">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("backToLogin")}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md border-none shadow-2xl shadow-primary/5 rounded-[2.5rem] overflow-hidden">
      <CardHeader className="space-y-3 text-center pb-8 pt-10">
        <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-2 transform -rotate-6">
            <Mail className="h-8 w-8 text-primary" />
          </div>
        <CardTitle className="text-3xl font-extrabold tracking-tight text-gray-900">{t("title")}</CardTitle>
        <CardDescription className="text-base">
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-2xl bg-red-50 p-4 border-none flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
              <p className="text-sm font-bold text-red-900 leading-tight">{error}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-bold text-gray-700 ml-1">{tc("email")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder={tLogin("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 rounded-xl bg-muted/20 border-none focus-visible:ring-primary"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform mt-4" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {tLogin("loggingIn")}
              </>
            ) : (
              t("sendLink")
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="pb-10 pt-2">
        <Link href="/login" className="text-sm text-primary hover:underline mx-auto flex items-center gap-2 font-bold">
          <ArrowLeft className="h-4 w-4" />
          {t("backToLogin")}
        </Link>
      </CardFooter>
    </Card>
  )
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-secondary/50 via-background to-background py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<Loader2 className="h-10 w-10 animate-spin text-primary" />}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  )
}
