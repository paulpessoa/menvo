"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, User, Phone, MessageSquare, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react"
import { useTranslation } from "react-i18next"

interface WaitingListFormProps {
    onSuccess?: () => void
}

export function WaitingListForm({ onSuccess }: WaitingListFormProps) {
    const { t } = useTranslation()
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [whatsapp, setWhatsapp] = useState("")
    const [reason, setReason] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        // Validation
        if (!name.trim()) {
            setError("Nome é obrigatório")
            setIsLoading(false)
            return
        }

        if (!email.trim()) {
            setError("E-mail é obrigatório")
            setIsLoading(false)
            return
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setError("E-mail inválido")
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch("/api/waiting-list", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.toLowerCase().trim(),
                    whatsapp: whatsapp.trim() || null,
                    reason: reason.trim() || null,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                if (response.status === 409) {
                    setError("Este e-mail já está cadastrado na lista de espera")
                } else {
                    setError(data.error || "Erro ao se inscrever na lista de espera")
                }
                return
            }

            setSuccess(true)
            onSuccess?.()
        } catch (err: any) {
            setError("Erro de conexão. Tente novamente.")
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle>{t("waitingList.successMessage")}</CardTitle>
                    <CardDescription>
                        Você foi adicionado à nossa lista de espera. Entraremos em contato em breve!
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                        <h4 className="font-semibold text-blue-800 mb-2">Próximos passos:</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Você receberá um e-mail de confirmação</li>
                            <li>• Nossa equipe analisará sua inscrição</li>
                            <li>• Entraremos em contato quando houver vagas disponíveis</li>
                            <li>• Fique atento ao seu e-mail e WhatsApp</li>
                        </ul>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button asChild className="w-full">
                        <Link href="/">
                            Voltar ao Início
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">
                    {t("waitingList.title")}
                </CardTitle>
                <CardDescription className="text-center">
                    {t("waitingList.description")}
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
                        <Label htmlFor="name">{t("waitingList.nameLabel")}</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="name"
                                type="text"
                                placeholder={t("waitingList.namePlaceholder")}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="pl-10"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="email"
                                type="email"
                                placeholder={t("waitingList.emailPlaceholder")}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="whatsapp">{t("waitingList.whatsappLabel")}</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="whatsapp"
                                type="tel"
                                placeholder={t("waitingList.whatsappPlaceholder")}
                                value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason">{t("waitingList.reasonLabel")}</Label>
                        <div className="relative">
                            <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Textarea
                                id="reason"
                                placeholder={t("waitingList.reasonPlaceholder")}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="pl-10 min-h-[80px]"
                                rows={3}
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
                            <>
                                Entrar na Lista de Espera
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