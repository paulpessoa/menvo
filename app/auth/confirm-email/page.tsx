"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Loader2, CheckCircle, AlertTriangle, Shield } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

export default function ConfirmEmailPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired' | 'manual'>('loading')
    const [message, setMessage] = useState('')
    const [otpCode, setOtpCode] = useState('')
    const [email, setEmail] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isResending, setIsResending] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')
        const emailParam = searchParams.get('email')

        if (emailParam) {
            setEmail(emailParam)
        }

        // If we have token_hash, try automatic confirmation
        if (token_hash && type === 'email') {
            confirmEmailWithToken(token_hash)
        } else {
            // Show manual OTP input and try to get user email
            getUserEmail()
        }
    }, [searchParams])

    const getUserEmail = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.email) {
                setEmail(user.email)
            }
        } catch (error) {
            console.error("Error getting user:", error)
        } finally {
            setStatus('manual')
            setMessage('Digite o código de 6 dígitos enviado para seu email.')
        }
    }

    const confirmEmailWithToken = async (token_hash: string) => {
        try {
            const { data, error } = await supabase.auth.verifyOtp({
                token_hash,
                type: 'email'
            })

            if (error) {
                console.error('Confirmation error:', error)
                if (error.message.includes('expired')) {
                    setStatus('expired')
                    setMessage('O link de confirmação expirou. Use o código OTP ou solicite um novo.')
                } else {
                    setStatus('manual')
                    setMessage('Link inválido. Digite o código de 6 dígitos enviado para seu email.')
                }
                await getUserEmail()
                return
            }

            if (data.user) {
                setStatus('success')
                setMessage('Email confirmado com sucesso!')

                setTimeout(() => {
                    router.push('/auth/select-role')
                }, 2000)
            }
        } catch (error) {
            console.error('Unexpected error:', error)
            setStatus('manual')
            setMessage('Digite o código de 6 dígitos enviado para seu email.')
            await getUserEmail()
        }
    }

    const confirmWithOTP = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!otpCode || otpCode.length !== 6) {
            setMessage('Digite um código de 6 dígitos válido.')
            return
        }

        if (!email) {
            setMessage('Email é obrigatório. Tente fazer login novamente.')
            return
        }

        setIsSubmitting(true)

        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email: email,
                token: otpCode,
                type: 'email'
            })

            if (error) {
                console.error('OTP verification error:', error)
                setMessage('Código inválido ou expirado. Tente novamente.')
                setIsSubmitting(false)
                return
            }

            if (data.user) {
                setStatus('success')
                setMessage('Email confirmado com sucesso!')

                setTimeout(() => {
                    router.push('/auth/select-role')
                }, 2000)
            }
        } catch (error) {
            console.error('Unexpected error:', error)
            setMessage('Erro inesperado. Tente novamente.')
        }

        setIsSubmitting(false)
    }

    const resendConfirmation = async () => {
        if (!email) {
            setMessage('Email não encontrado. Tente fazer login novamente.')
            return
        }

        setIsResending(true)

        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`
                }
            })

            if (error) {
                if (error.message?.includes("Email rate limit exceeded")) {
                    setMessage("Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.")
                } else if (error.message?.includes("Email already confirmed")) {
                    setMessage("Email já confirmado. Você pode fazer login normalmente.")
                } else {
                    setMessage('Erro ao reenviar: ' + error.message)
                }
            } else {
                setMessage('Novo código enviado! Verifique seu email.')
            }
        } catch (error) {
            setMessage('Erro inesperado ao reenviar código.')
        } finally {
            setIsResending(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4">
                        {status === 'loading' && <Loader2 className="h-12 w-12 animate-spin text-blue-600" />}
                        {status === 'success' && <CheckCircle className="h-12 w-12 text-green-600" />}
                        {status === 'manual' && <Shield className="h-12 w-12 text-blue-600" />}
                        {(status === 'error' || status === 'expired') && <AlertTriangle className="h-12 w-12 text-red-600" />}
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        {status === 'loading' && 'Confirmando Email...'}
                        {status === 'success' && 'Email Confirmado!'}
                        {status === 'manual' && 'Confirmar Email'}
                        {status === 'error' && 'Erro na Confirmação'}
                        {status === 'expired' && 'Link Expirado'}
                    </CardTitle>
                    <CardDescription>
                        {status === 'loading' && 'Aguarde enquanto confirmamos seu email.'}
                        {status === 'success' && 'Você será redirecionado em instantes.'}
                        {status === 'manual' && 'Digite o código de 6 dígitos ou use o link do email.'}
                        {(status === 'error' || status === 'expired') && 'Use o código OTP ou solicite um novo.'}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {message && (
                        <Alert className={status === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                            <AlertDescription className={status === 'success' ? 'text-green-800' : 'text-red-800'}>
                                {message}
                            </AlertDescription>
                        </Alert>
                    )}

                    {status === 'manual' && (
                        <form onSubmit={confirmWithOTP} className="space-y-4">
                            {!email && (
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            {email && (
                                <div className="text-sm text-gray-600 mb-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    Código enviado para: <strong>{email}</strong>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="otp">Código de Confirmação (6 dígitos)</Label>
                                <Input
                                    id="otp"
                                    type="text"
                                    placeholder="123456"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    maxLength={6}
                                    className="text-center text-lg tracking-widest"
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting || otpCode.length !== 6}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Confirmando...
                                    </>
                                ) : (
                                    'Confirmar Email'
                                )}
                            </Button>
                        </form>
                    )}

                    {status === 'success' && (
                        <div className="text-center">
                            <p className="text-sm text-gray-600 mb-4">
                                Redirecionando para seleção de perfil...
                            </p>
                            <Button asChild className="w-full">
                                <Link href="/auth/select-role">Continuar</Link>
                            </Button>
                        </div>
                    )}

                    {(status === 'expired' || status === 'manual') && (
                        <div className="space-y-3">
                            <Button
                                onClick={resendConfirmation}
                                variant="outline"
                                className="w-full"
                                disabled={isResending}
                            >
                                {isResending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Reenviando...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="mr-2 h-4 w-4" />
                                        Reenviar Código
                                    </>
                                )}
                            </Button>
                            <Button variant="ghost" asChild className="w-full">
                                <Link href="/auth/login">Voltar ao Login</Link>
                            </Button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="space-y-3">
                            <Button variant="outline" asChild className="w-full">
                                <Link href="/auth/login">Voltar ao Login</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
