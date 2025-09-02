"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Search, Clock, CheckCircle, ArrowRight } from "lucide-react"
import Link from "next/link"
import { RequireRole } from "@/lib/auth/auth-guard"
import { useAuth } from "@/lib/auth"

export default function MenteeDashboard() {
    const { profile } = useAuth()

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return "Bom dia"
        if (hour < 18) return "Boa tarde"
        return "Boa noite"
    }

    const quickActions = [
        {
            title: "Encontrar Mentores",
            description: "Busque mentores verificados em sua área de interesse",
            href: "/mentors",
            icon: Search,
            color: "bg-blue-500"
        },
        {
            title: "Meus Agendamentos",
            description: "Veja suas sessões de mentoria agendadas",
            href: "/mentee/appointments",
            icon: Calendar,
            color: "bg-green-500"
        },
        {
            title: "Editar Perfil",
            description: "Atualize suas informações e interesses",
            href: "/profile",
            icon: Users,
            color: "bg-purple-500"
        }
    ]

    return (
        <RequireRole roles={['mentee']}>
            <div className="container mx-auto px-4 py-8">
                <div className="space-y-8">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold">
                            {getGreeting()}, {profile?.full_name || "Mentee"}!
                        </h1>
                        <p className="text-muted-foreground">
                            Bem-vindo ao seu dashboard. Encontre mentores e acelere seu crescimento profissional.
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                <CardTitle className="text-sm font-medium">Mentores</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-muted-foreground">
                                    Mentores conectados
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Horas</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-muted-foreground">
                                    Total de mentoria
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <h2 className="text-2xl font-semibold mb-6">Ações Rápidas</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {quickActions.map((action, index) => (
                                <Card key={index} className="hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className={`p-2 rounded-lg ${action.color} w-fit`}>
                                            <action.icon className="h-6 w-6 text-white" />
                                        </div>
                                        <CardTitle className="text-lg">{action.title}</CardTitle>
                                        <CardDescription>{action.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button asChild className="w-full">
                                            <Link href={action.href}>
                                                Acessar
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Getting Started */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Primeiros Passos</CardTitle>
                            <CardDescription>
                                Complete estas etapas para aproveitar ao máximo a plataforma
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="text-sm">Cadastro realizado</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="text-sm">Papel de mentee selecionado</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                <span className="text-sm text-muted-foreground">Complete seu perfil</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                <span className="text-sm text-muted-foreground">Encontre seu primeiro mentor</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                <span className="text-sm text-muted-foreground">Agende sua primeira sessão</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Featured Mentors */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Mentores em Destaque</CardTitle>
                            <CardDescription>
                                Conheça alguns dos nossos mentores mais experientes
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">
                                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Nenhum mentor encontrado</h3>
                                <p className="text-muted-foreground mb-4">
                                    Ainda não temos mentores verificados disponíveis.
                                </p>
                                <Button asChild>
                                    <Link href="/mentors">
                                        Ver Todos os Mentores
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </RequireRole>
    )
}