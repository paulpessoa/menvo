"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Loader2, Mail, Lock, User, ArrowRight, AlertTriangle } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useFeatureFlag } from "@/lib/feature-flags"
import { WaitingListForm } from "@/components/WaitingListForm"

interface RegisterFormProps {
    onSuccess?: () => void
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSocialLoading, setIsSocialLoading] = useState<string | null>(null)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    const { signUp, signInWithProvider } = useAuth()
    const waitingListEnabled = useFeatureFlag("waitingListEnabled")
    const newUserRegistration = useFeatureFlag("newUserRegistration")

    // If waiting list is enabled and new user registration is disabled, show waiting list form
    if (waitingListEnabled && !newUserRegistration) {
        return <WaitingListForm onSuccess={onSuccess} />
    }

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

        if (!firstName.trim() || !lastName.trim()) {
            setError("Nome e sobrenome são obrigatórios")
            setIsLoading(false)
            return
        }

        try {
            await signUp(email, password, firstName.trim(), lastName.trim())
            setSuccess(true)
            onSuccess?.()
        } catch (err: any) {
            setError(err.message || "Erro inesperado. Tente novamente.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSocialSignup = async (provider: "google" | "linkedin") => {
        setIsSocialLoading(provider)
        setError("")

        try {
            await signInWithProvider(provider)
            // OAuth redirects are handled by the callback route
        } catch (err: any) {
            setError(err.message || "Erro ao fazer cadastro. Tente novamente.")
        } finally {
            setIsSocialLoading(null)
        }
    }

    if (success) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <Mail className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle>Confirme seu email</CardTitle>
                    <CardDescription>
                        Enviamos um link de confirmação para {email}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground text-sm text-center">
                        Clique no link do email para confirmar sua conta e fazer login.
                    </p>

                    <div className="rounded-lg bg-yellow-50 p-3 border border-yellow-200">
                        <p className="text-xs text-yellow-800">
                            <strong>Não recebeu o email?</strong> Verifique sua caixa de spam ou lixo eletrônico.
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button asChild className="w-full">
                        <Link href="/auth/login">
                            Ir para Login
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/">Voltar ao Início</Link>
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">Criar conta</CardTitle>
                <CardDescription className="text-center">
                    Cadastre-se para começar sua jornada de mentoria
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full flex items-center justify-center gap-3 py-2.5"
                        onClick={() => handleSocialSignup("google")}
                        disabled={isSocialLoading === "google" || isLoading}
                    >
                        {isSocialLoading === "google" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                        )}
                        Cadastrar com Google
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full flex items-center justify-center gap-3 py-2.5"
                        onClick={() => handleSocialSignup("linkedin")}
                        disabled={isSocialLoading === "linkedin" || isLoading}
                    >
                        {isSocialLoading === "linkedin" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <svg className="h-5 w-5" fill="#0A66C2" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                        )}
                        Cadastrar com LinkedIn
                    </Button>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">ou cadastre-se com email</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Nome</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="firstName"
                                    type="text"
                                    placeholder="Seu nome"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Sobrenome</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="lastName"
                                    type="text"
                                    placeholder="Seu sobrenome"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>
                    </div>

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

                    <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
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
                        <Label htmlFor="confirmPassword">Confirmar senha</Label>
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
                                Criando conta...
                            </>
                        ) : (
                            <>
                                Criar conta
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
            <CardFooter>
                <div className="text-center text-sm text-muted-foreground w-full">
                    Já tem uma conta?{" "}
                    <Link href="/auth/login" className="text-primary hover:underline">
                        Faça login
                    </Link>
                </div>
            </CardFooter>
        </Card>
    )
}
