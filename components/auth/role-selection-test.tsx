"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, GraduationCap, CheckCircle, ArrowRight, Loader2, TestTube } from "lucide-react"
import { toast } from "sonner"

/**
 * Test component for role selection functionality
 * This component can be used to test the role selection UI without authentication
 */

type UserRole = "mentee" | "mentor"

const roles = [
    {
        id: "mentee" as UserRole,
        name: "Mentorado",
        description: "Busco orientação e acompanhamento para crescer profissionalmente",
        icon: Users,
        color: "bg-blue-100 text-blue-800",
        benefits: [
            "Acesso a mentores experientes",
            "Sessões de mentoria personalizadas",
            "Networking profissional",
            "Desenvolvimento de carreira",
        ],
    },
    {
        id: "mentor" as UserRole,
        name: "Mentor",
        description: "Quero compartilhar conhecimento e ajudar outros profissionais",
        icon: GraduationCap,
        color: "bg-green-100 text-green-800",
        benefits: [
            "Compartilhar experiência",
            "Impactar carreiras",
            "Expandir rede de contatos",
            "Desenvolver habilidades de liderança",
        ],
    },
]

export default function RoleSelectionTest() {
    const [selectedRole, setSelectedRole] = useState<UserRole | "">("")
    const [isLoading, setIsLoading] = useState(false)

    const handleRoleSelection = async () => {
        if (!selectedRole) {
            toast.error("Por favor, selecione um perfil")
            return
        }

        setIsLoading(true)
        try {
            console.log("🧪 Teste: Selecionando role:", selectedRole)

            // Show loading toast
            const loadingToast = toast.loading("Salvando seu perfil...")

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000))

            // Dismiss loading toast
            toast.dismiss(loadingToast)

            console.log("✅ Teste: Role selecionada com sucesso")
            toast.success(`Perfil ${selectedRole === 'mentor' ? 'Mentor' : 'Mentorado'} selecionado com sucesso!`)

            // Simulate redirect
            await new Promise(resolve => setTimeout(resolve, 1000))

            const dashboardPath = selectedRole === 'mentor' ? '/dashboard/mentor' : '/dashboard/mentee'
            console.log("🔄 Teste: Redirecionaria para:", dashboardPath)
            toast.info(`Redirecionaria para: ${dashboardPath}`)

        } catch (error: any) {
            console.error("❌ Teste: Erro ao selecionar role:", error)
            toast.error("Erro no teste de seleção de role")
        } finally {
            setIsLoading(false)
        }
    }

    const testErrorScenarios = () => {
        const scenarios = [
            { name: "Nenhuma role selecionada", action: () => handleRoleSelection() },
            { name: "Erro de rede simulado", action: () => toast.error("Erro de conexão simulado") },
            { name: "Sessão expirada simulada", action: () => toast.error("Sessão expirada simulada") }
        ]

        scenarios.forEach((scenario, index) => {
            setTimeout(() => {
                console.log(`🧪 Testando: ${scenario.name}`)
                scenario.action()
            }, index * 1000)
        })
    }

    return (
        <div className="container max-w-4xl py-16">
            <Card>
                <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <TestTube className="h-6 w-6 text-primary" />
                        <span className="text-sm font-medium text-primary">MODO TESTE</span>
                    </div>
                    <CardTitle className="text-2xl">Escolha seu perfil</CardTitle>
                    <CardDescription>
                        Selecione como você gostaria de participar da nossa plataforma. Você poderá alterar isso depois nas configurações.
                    </CardDescription>
                    <div className="text-sm text-muted-foreground mt-2">
                        Configurando perfil para: <span className="font-medium">test@example.com</span>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {roles.map((role) => (
                            <Card
                                key={role.id}
                                className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${selectedRole === role.id
                                        ? "ring-2 ring-primary shadow-lg scale-105"
                                        : "hover:border-primary/50"
                                    } ${isLoading ? "pointer-events-none opacity-50" : ""}`}
                                onClick={() => !isLoading && setSelectedRole(role.id)}
                            >
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className={`p-2 rounded-lg ${role.color}`}>
                                            <role.icon className="h-6 w-6" />
                                        </div>
                                        {selectedRole === role.id && <CheckCircle className="h-5 w-5 text-primary" />}
                                    </div>
                                    <CardTitle className="text-lg">{role.name}</CardTitle>
                                    <CardDescription>{role.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Benefícios:</p>
                                        <ul className="text-sm text-muted-foreground space-y-1">
                                            {role.benefits.map((benefit, index) => (
                                                <li key={index} className="flex items-center gap-2">
                                                    <div className="w-1 h-1 bg-current rounded-full" />
                                                    {benefit}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <Button
                            onClick={handleRoleSelection}
                            disabled={!selectedRole || isLoading}
                            className="w-full"
                            size="lg"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    Confirmar Seleção
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={testErrorScenarios}
                            variant="outline"
                            className="w-full"
                            disabled={isLoading}
                        >
                            <TestTube className="mr-2 h-4 w-4" />
                            Testar Cenários de Erro
                        </Button>
                    </div>

                    <div className="text-xs text-muted-foreground text-center">
                        Este é um componente de teste. Não fará alterações reais no banco de dados.
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}