"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [isValidSession, setIsValidSession] = useState(false)
    const [checkingSession, setCheckingSession] = useState(true)

    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()

                // Check if user has a valid session from password recovery
                if (session?.user) {
                    setIsValidSession(true)
                } else {
                    setError("Sessão inválida. Solicite um novo link de recuperação de senha.")
                }
            } catch (error) {
                setError("Erro ao verificar sessão. Tente novamente.")
            } finally {
                setCheckingSession(false)
            }
        }

        checkSession()
    }, [supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        // Validation
        if (password !== confirmPassword) {
            setError("As senhas não coincidem")
            setIsLoading(false)
            return
        }

        if (password.length < 6) {
            setError("A senha deve ter pelo menos 6 caracteres")
            setIsLoading(false)
            return
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) {
                setError(error.message || "Erro ao atualizar senha. Tente novamente.")
            } else {
                setSuccess(true)
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push("/auth/login")
                }, 3000)
            }
        } catch (error) {
            setError("Erro inesperado. Tente novamente.")
        } finally {
            setIsLoading(false)
        }
    }

    if (checkingSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-gray-600">Verificando sessão...</p>
                </div>
            </div>
        )
    }

    if (!isValidSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <CardTitle>Sessão Inválida</CardTitle>
                        <CardDescription>
                            O link de recuperação de senha expirou ou é inválido
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button asChild className="w-full">
                            <Link href="/auth/forgot-password">
                                Solicitar novo link
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/auth/login">
                                Voltar ao Login
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle>Senha atualizada!</CardTitle>
                        <CardDescription>
                            Sua senha foi alterada com sucesso
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-4">
                                Você será redirecionado para a página de login em alguns segundos.
                            </p>
                            <div className="animate-pulse text-sm text-blue-600">
                                Redirecionando...
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button asChild className="w-full">
                            <Link href="/auth/login">
                                Ir para Login agora
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
                    <CardTitle className="text-2xl font-bold text-center">Nova senha</CardTitle>
                    <CardDescription className="text-center">
                        Digite sua nova senha abaixo
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
                            <Label htmlFor="password">Nova senha</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Mínimo 6 caracteres"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Digite a senha novamente"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Atualizando senha...
                                </>
                            ) : (
                                "Atualizar senha"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/auth/login">
                            Voltar ao Login
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}