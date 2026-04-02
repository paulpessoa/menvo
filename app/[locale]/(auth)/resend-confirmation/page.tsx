"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, ArrowLeft, CheckCircle, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useTranslations } from "next-intl"

export default function ResendConfirmationPage() {
  const t = useTranslations("auth.resend")
  const tCommon = useTranslations("common")
  const tLogin = useTranslations("login")
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError(tCommon("email" ? "error" : "")) // Fallback
      return
    }

    setLoading(true)
    setError("")

    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.toLowerCase().trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`
        }
      })

      if (error) {
        console.error("Error resending confirmation:", error)
        setError(t("error"))
      } else {
        setSent(true)
      }
    } catch (error) {
      console.error("Unexpected error:", error)
      setError(t("error"))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">
              {t("successTitle")}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {t("successDescription")}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                {t("sentTo")} <strong>{email}</strong>
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => router.push("/login")}
                className="w-full"
              >
                {tLogin("loginButton")}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setSent(false)}
                className="w-full"
              >
                {t("otherEmail")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md text-foreground">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {t("title")}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {t("description")}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleResend} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{tCommon("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={tLogin("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tLogin("loggingIn" ? "..." : "")}
                </>
              ) : (
                t("button")
              )}
            </Button>

            <Button 
              type="button"
              variant="ghost" 
              onClick={() => router.back()}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {tCommon("back")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
