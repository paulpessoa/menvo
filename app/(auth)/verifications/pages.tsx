"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import { ResendConfirmationEmail } from "@/components/auth/ResendConfirmationEmail"
import { EmailConfirmationBanner } from "@/components/auth/EmailConfirmationBanner"

export default function VerificationsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [verificationStatus, setVerificationStatus] = useState<"pending" | "verified" | "error" | "loading">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // If no user, redirect to login
        router.push("/login")
        toast({
          title: "Acesso negado",
          description: "Você precisa estar logado para ver esta página.",
          variant: "destructive",
        })
      } else if (user.email_confirmed_at) {
        // If email is already confirmed, redirect to dashboard
        setVerificationStatus("verified")
        setMessage("Seu e-mail já foi verificado. Redirecionando para o painel...")
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        // Email not confirmed
        setVerificationStatus("pending")
        setMessage("Seu e-mail ainda não foi verificado. Por favor, verifique sua caixa de entrada.")
      }
    }
  }, [user, loading, router, toast])

  if (loading || verificationStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Carregando status de verificação...</p>
      </div>
    )
  }

  if (!user) {
    return null // Should be redirected by useEffect
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-1">
          {verificationStatus === "pending" && (
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
          )}
          {verificationStatus === "verified" && (
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          )}
          <CardTitle className="text-2xl font-bold">
            {verificationStatus === "pending" && "Verifique seu E-mail"}
            {verificationStatus === "verified" && "E-mail Verificado!"}
          </CardTitle>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verificationStatus === "pending" && (
            <>
              <p className="text-sm text-muted-foreground">
                Um link de verificação foi enviado para <strong>{user.email}</strong>. Por favor, clique no link para ativar sua conta.
              </p>
              <ResendConfirmationEmail email={user.email || ""} />
              <EmailConfirmationBanner />
            </>
          )}
          {verificationStatus === "verified" && (
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Ir para o Painel
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
