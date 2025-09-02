"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

export default function ConfirmEmailPage() {
    const [isResending, setIsResending] = useState(false)
    const [resendSuccess, setResendSuccess] = useState(false)
    const [resendError, setResendError] = useState("")
    const [userEmail, setUserEmail] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    const supabase = createClient()

    useEffect(() => {
        const getUserEmail = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user?.email) {
                    setUserEmail(user.email)
                }
            } catch (error) {
                console.error("Error getting user:", error)
            } finally {
                setIsLoading(false)
            }
        }

        getUserEmail()
    }, [supabase])

    const handleResendEmail = async () => {
        setIsResending(true)
        setResendError("")
        setResendSuccess(false)

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser()

            if (!user?.email) {
                setResendError("Não foi possível encontrar seu email. Tente fazer login novamente.")
                return
            }

            // Resend confirmation email
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: user.email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`
                }
            })

            if (error) {
                if (error.message?.includes("Email rate limit exceeded")) {
                    setResendError("Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.")
                } else if (error.message?.includes("Email already confirmed")) {
                    setResendError("Email já confirmado. Você pode fazer login normalmente.")
                } else {
                    setResendError(error.message || "Erro ao reenviar email. Tente novamente.")
                }
            } else {
                setResendSuccess(true)
            }
        } catch (error) {
            setResendError("Erro inesperado. Tente novamente.")
        } finally {
            setIsResending(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-gray-600">Carregando...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <Mail className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle>Confirme seu email</CardTitle>
                    <CardDescription>
                        Enviamos um link de confirmação para seu email
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Para continuar, clique no link de confirmação que enviamos para seu email.
                        </p>

                        {userEmail && (
                            <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
                                <p className="text-xs text-blue-800">
                                    <strong>Email enviado para:</strong> {userEmail}
                                </p>
                            </div>
                        )}

                        <div className="rounded-lg bg-amber-50 p-3 border border-amber-200">
                            <p className="text-xs text-amber-800">
                                <strong>Dica:</strong> Se não encontrar o email, verifique sua caixa de spam ou lixo eletrônico.
                            </p>
                        </div>
                    </div>

                    {resendSuccess && (
                        <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>
                                Email de confirmação reenviado com sucesso! Verifique sua caixa de entrada.
                            </AlertDescription>
                        </Alert>
                    )}

                    {resendError && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{resendError}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Button
                            onClick={handleResendEmail}
                            disabled={isResending || resendSuccess}
                            variant="outline"
                            className="w-full"
                        >
                            {isResending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Reenviando...
                                </>
                            ) : resendSuccess ? (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Email reenviado
                                </>
                            ) : (
                                "Reenviar email de confirmação"
                            )}
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/auth/login">
                            Voltar ao Login
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full">
                        <Link href="/">
                            Ir para Início
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}