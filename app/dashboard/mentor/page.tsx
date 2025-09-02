"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Settings, Clock, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { RequireRole } from "@/lib/auth/auth-guard"
import { useAuth } from "@/lib/auth"

export default function MentorDashboard() {
    const { profile, isVerified } = useAuth()

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return "Bom dia"
        if (hour < 18) return "Boa tarde"
        return "Boa noite"
    }

    const quickActions = [
        {
            title: "Configurar Disponibilidade",
            description: "Defina seus horários disponíveis para mentoria",
            href: "/mentor/availability",
            icon: Calendar,
            color: "bg-blue-500",
            disabled: !isVerified
        },
        {
            title: "Ver Agendamentos",
            description: "Gerencie suas sessões de mentoria",
            href: "/mentor/appointments",
            icon: Clock,
            color: "bg-green-500",
            disabled: !isVerified
        },
        {
            title: "Editar Perfil",
            description: "Atualize suas informações e especialidades",
            href: "/profile",
            icon: Settings,
            color: "bg-purple-500",
            disabled: false
        }
    ]

    return (
        <RequireRole roles={['mentor']}>
            <div className="container mx-auto px-4 py-8">
                <div className="space-y-8">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold">
                            {getGreeting()}, {profile?.full_name || "Mentor"}!
                        </h1>
                        <p className="text-muted-foreground">
                            Bem-vindo ao seu dashboard de mentor. Gerencie suas mentorias e ajude outros profissionais.
                        </p>
                    </div>

                    {/* Verification Status */}
                    <Card className={isVerified ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
                        <CardContent className="flex items-center gap-4 p-6">
                            {isVerified ? (
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            ) : (
                                <AlertCircle className="h-8 w-8 text-yellow-600" />
                            )}
                            <div className="flex-1">
                                <h3 className="font-semibold">
                                    {isVerified ? "Perfil Verificado" : "Verificação Pendente"}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {isVerified
                                        ? "Seu perfil foi verificado! Você pode receber agendamentos de mentees."
                                        : "Seu perfil está aguardando verificação. Você receberá um email quando for aprovado."
                                    }
                                </p>
                            </div>
                            <Badge variant={isVerified ? "default" : "secondary"}>
                                {isVerified ? "Verificado" : "Pendente"}
                            </Badge>
                        </CardContent>
                    </Card>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Status</CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {isVerified ? "Ativo" : "Pendente"}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Status da verificação
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-muted-foreground">
                                    Próximas sessões
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Mentees</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-muted-foreground">
                                    Total de mentees
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <h2 className="text-2xl font-semibold mb-6">Ações Rápidas</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {quickActions.map((action, index) => (
                                <Card key={index} className={`hover:shadow-md transition-shadow ${action.disabled ? 'opacity-50' : ''}`}>
                                    <CardHeader>
                                        <div className={`p-2 rounded-lg ${action.color} w-fit`}>
                                            <action.icon className="h-6 w-6 text-white" />
                                        </div>
                                        <CardTitle className="text-lg">{action.title}</CardTitle>
                                        <CardDescription>{action.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button
                                            asChild={!action.disabled}
                                            className="w-full"
                                            disabled={action.disabled}
                                        >
                                            {action.disabled ? (
                                                <span>
                                                    {action.title.includes('Disponibilidade') || action.title.includes('Agendamentos')
                                                        ? 'Aguardando Verificação'
                                                        : 'Acessar'
                                                    }
                                                </span>
                                            ) : (
                                                <Link href={action.href}>
                                                    Acessar
                                                </Link>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Getting Started */}
                    {!isVerified && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Primeiros Passos</CardTitle>
                                <CardDescription>
                                    Complete estas etapas para começar a oferecer mentorias
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="text-sm">Cadastro realizado</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="text-sm">Papel de mentor selecionado</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                                    <span className="text-sm">Aguardando verificação do perfil</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                    <span className="text-sm text-muted-foreground">Configurar disponibilidade</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                    <span className="text-sm text-muted-foreground">Receber primeiro agendamento</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </RequireRole>
    )
}