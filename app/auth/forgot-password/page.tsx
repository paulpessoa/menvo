"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Loader2, CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState("")

    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?type=recovery`
            })

            if (error) {
                if (error.message?.includes("Email not found")) {
                    setError("Email não encontrado. Verifique se você digitou corretamente.")
                } else if (error.message?.includes("Email not confirmed")) {
                    setError("Email não confirmado. Confirme seu email antes de recuperar a senha.")
                } else {
                    setError(error.message || "Erro ao enviar email de recuperação. Tente novamente.")
                }
            } else {
                setSuccess(true)
            }
        } catch (error) {
            setError("Erro inesperado. Tente novamente.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleResendEmail = async () => {
        if (!email) {
            setError("Digite seu email primeiro.")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?type=recovery`
            })

            if (error) {
                setError(error.message || "Erro ao reenviar email. Tente novamente.")
            } else {
                setSuccess(true)
            }
        } catch (error) {
            setError("Erro inesperado. Tente novamente.")
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle>Email enviado!</CardTitle>
                        <CardDescription>
                            Enviamos um link de recuperação para seu email
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Verifique sua caixa de entrada e clique no link para redefinir sua senha.
                            </p>

                            <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
                                <p className="text-xs text-blue-800">
                                    <strong>Email enviado para:</strong> {email}
                                </p>
                            </div>

                            <div className="rounded-lg bg-amber-50 p-3 border border-amber-200">
                                <p className="text-xs text-amber-800">
                                    <strong>Dica:</strong> Se não encontrar o email, verifique sua caixa de spam.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Button
                                onClick={handleResendEmail}
                                disabled={isLoading}
                                variant="outline"
                                className="w-full"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Reenviando...
                                    </>
                                ) : (
                                    "Reenviar email"
                                )}
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/auth/login">
                                <ArrowLeft className="mr-2 h-4 w-4" />
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Esqueceu a senha?</CardTitle>
                    <CardDescription className="text-center">
                        Digite seu email para receber um link de recuperação
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nome@exemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                "Enviar link de recuperação"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/auth/login">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar ao Login
                        </Link>
                    </Button>
                    <div className="text-center text-sm text-muted-foreground w-full">
                        Não tem uma conta?{" "}
                        <Link href="/auth/register" className="text-primary hover:underline">
                            Cadastre-se
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}