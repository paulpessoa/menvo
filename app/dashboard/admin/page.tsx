"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, CheckCircle, Clock, Settings, Shield, BarChart3 } from "lucide-react"
import Link from "next/link"
import { RequireRole } from "@/lib/auth/auth-guard"
import { useAuth } from "@/lib/auth"

export default function AdminDashboard() {
    const { profile } = useAuth()

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return "Bom dia"
        if (hour < 18) return "Boa tarde"
        return "Boa noite"
    }

    const quickActions = [
        {
            title: "Verificar Mentores",
            description: "Revisar e aprovar mentores pendentes",
            href: "/admin/mentors/verify",
            icon: CheckCircle,
            color: "bg-green-500"
        },
        {
            title: "Gerenciar Usuários",
            description: "Visualizar e gerenciar todos os usuários",
            href: "/admin/users",
            icon: Users,
            color: "bg-blue-500"
        },
        {
            title: "Relatórios",
            description: "Ver estatísticas e métricas da plataforma",
            href: "/admin/reports",
            icon: BarChart3,
            color: "bg-purple-500"
        },
        {
            title: "Configurações",
            description: "Configurar parâmetros da plataforma",
            href: "/admin/settings",
            icon: Settings,
            color: "bg-gray-500"
        }
    ]

    return (
        <RequireRole roles={['admin']}>
            <div className="container mx-auto px-4 py-8">
                <div className="space-y-8">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold">
                            {getGreeting()}, {profile?.full_name || "Admin"}!
                        </h1>
                        <p className="text-muted-foreground">
                            Bem-vindo ao painel administrativo. Gerencie a plataforma e seus usuários.
                        </p>
                    </div>

                    {/* Admin Badge */}
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="flex items-center gap-4 p-6">
                            <Shield className="h-8 w-8 text-red-600" />
                            <div className="flex-1">
                                <h3 className="font-semibold">Acesso Administrativo</h3>
                                <p className="text-sm text-muted-foreground">
                                    Você tem privilégios de administrador na plataforma.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Usuários</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-muted-foreground">
                                    Usuários registrados
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Mentores Pendentes</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-muted-foreground">
                                    Aguardando verificação
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Mentores Ativos</CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-muted-foreground">
                                    Mentores verificados
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-muted-foreground">
                                    Este mês
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <h2 className="text-2xl font-semibold mb-6">Ações Administrativas</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Atividade Recente</CardTitle>
                            <CardDescription>
                                Últimas ações na plataforma
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">
                                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Nenhuma atividade recente</h3>
                                <p className="text-muted-foreground">
                                    As atividades da plataforma aparecerão aqui.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </RequireRole>
    )
}