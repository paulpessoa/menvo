"use client"

import { useAuth } from "@/lib/auth"
import { useIsVolunteer } from "@/hooks/useVolunteerAccess"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock } from "lucide-react"

export function VolunteerAccessTest() {
    const { user } = useAuth()
    const { data: isVolunteer, isLoading, error } = useIsVolunteer()

    if (!user) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Teste de Acesso de Voluntário</CardTitle>
                    <CardDescription>Usuário não autenticado</CardDescription>
                </CardHeader>
                <CardContent>
                    <Badge variant="secondary">Não logado</Badge>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Teste de Acesso de Voluntário</CardTitle>
                <CardDescription>Status do usuário atual: {user.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                    <span className="font-medium">Status de Voluntário:</span>
                    {isLoading ? (
                        <Badge variant="secondary">
                            <Clock className="w-3 h-3 mr-1" />
                            Carregando...
                        </Badge>
                    ) : error ? (
                        <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" />
                            Erro
                        </Badge>
                    ) : isVolunteer ? (
                        <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            É Voluntário
                        </Badge>
                    ) : (
                        <Badge variant="secondary">
                            <XCircle className="w-3 h-3 mr-1" />
                            Não é Voluntário
                        </Badge>
                    )}
                </div>

                <div className="text-sm text-muted-foreground">
                    <p><strong>Acesso ao Check-in:</strong> {isVolunteer ? "✅ Permitido" : "❌ Negado"}</p>
                    <p><strong>Formulários no Voluntariômetro:</strong> {isVolunteer ? "✅ Visíveis" : "❌ Ocultos"}</p>
                </div>

                {error && (
                    <div className="text-sm text-red-500">
                        Erro: {error.message}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
