"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/utils/supabase/client"
import { useTranslations } from "next-intl"

export function ResendForm({ initialEmail = "" }: { initialEmail?: string }) {
  const t = useTranslations("auth.resend")
  const tCommon = useTranslations("common")
  const tLogin = useTranslations("login")
  const router = useRouter()
  
  const [email, setEmail] = useState(initialEmail)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  // Função interna para tratar erros (não pode vir do servidor via props)
  const handleAuthError = (error: any): string => {
    if (!error) return ""
    const message = error.message || ""
    if (message.includes("Rate limit")) return "Muitas tentativas. Tente novamente mais tarde."
    return message || "Ocorreu um erro ao reenviar o e-mail."
  }

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) return

    setLoading(true)
    setError("")

    try {
      const supabase = createClient()
      
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.toLowerCase().trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?type=signup`
        }
      })

      if (resendError) {
        console.error("Error resending confirmation:", resendError)
        setError(handleAuthError(resendError))
      } else {
        setSent(true)
      }
    } catch (err: any) {
      console.error("Unexpected error:", err)
      setError(handleAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center animate-in fade-in duration-500">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-900">{t("successTitle")}</h3>
          <p className="text-sm text-gray-500">
            {t("successDescription")}
          </p>
          <p className="text-xs text-muted-foreground font-mono bg-gray-50 p-2 rounded">
            {email}
          </p>
        </div>
        <Button 
          variant="outline" 
          className="w-full h-12"
          onClick={() => router.push("/login")}
        >
          {tCommon("login")}
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleResend} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
          {tCommon("email")}
        </Label>
        <div className="relative group">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-12 border-gray-200 focus:border-primary focus:ring-primary/20"
            required
            disabled={loading}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 animate-in slide-in-from-top-1">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full h-12 font-bold"
        disabled={loading || !email}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {tLogin("loggingIn")}
          </>
        ) : (
          t("button")
        )}
      </Button>

      <Button 
        type="button" 
        variant="ghost" 
        onClick={() => router.back()}
        className="w-full h-12"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {tCommon("back")}
      </Button>
    </form>
  )
}
