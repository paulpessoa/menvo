"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, GraduationCap, CheckCircle, ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"

type UserType = "mentee" | "mentor"

const roles = [
  {
    id: "mentee" as UserType,
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
    id: "mentor" as UserType,
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

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState<UserType | "">("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { user, refreshProfile } = useAuth()

  const handleRoleSelection = async () => {
    if (!selectedRole || !user) {
      toast.error("Por favor, selecione um perfil")
      return
    }

    setIsLoading(true)
    try {
      console.log("🔄 Iniciando seleção de role:", selectedRole)

      const response = await fetch("/api/profile/role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: selectedRole,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro ao salvar role")
      }

      console.log("✅ Role atualizada com sucesso:", result)

      // Refresh profile to update context
      await refreshProfile()

      toast.success("Perfil atualizado com sucesso!")

      // Redirect based on role
      if (selectedRole === "mentor") {
        router.push("/onboarding/profile?role=mentor")
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("❌ Erro ao selecionar role:", error)
      toast.error("Erro ao atualizar perfil. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-16">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Escolha seu perfil</CardTitle>
          <CardDescription>
            Selecione como você gostaria de participar da nossa plataforma. Você poderá alterar isso depois.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((role) => (
              <Card
                key={role.id}
                className={`cursor-pointer transition-all hover:shadow-md ${selectedRole === role.id ? "ring-2 ring-primary" : ""
                  }`}
                onClick={() => setSelectedRole(role.id)}
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

          <Button onClick={handleRoleSelection} disabled={!selectedRole || isLoading} className="w-full" size="lg">
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
        </CardContent>
      </Card>
    </div>
  )
}
