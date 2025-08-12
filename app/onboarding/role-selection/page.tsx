"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserTypeSelector } from "@/components/auth/UserTypeSelector"
import { ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"

type UserType = "mentee" | "mentor"

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState<UserType>("mentee")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  const handleRoleSelection = async () => {
    if (!user) {
      toast.error("Usuário não encontrado")
      router.push("/login")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/profile/role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: selectedRole,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao salvar role")
      }

      toast.success("Role selecionada com sucesso!")

      // Redirecionar para o formulário de perfil
      router.push(`/onboarding/profile?role=${selectedRole}`)
    } catch (error) {
      console.error("Erro ao salvar role:", error)
      toast.error("Erro ao salvar sua seleção. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl py-16">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Bem-vindo à plataforma!</CardTitle>
          <CardDescription>Para começar, nos conte qual é o seu objetivo principal na nossa comunidade</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <UserTypeSelector userType={selectedRole} setUserType={setSelectedRole} />

          <Button onClick={handleRoleSelection} disabled={isLoading} className="w-full" size="lg">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
