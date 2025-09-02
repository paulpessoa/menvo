"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, GraduationCap, Heart, CheckCircle } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"

interface RoleSelectionModalProps {
  open: boolean
  onClose: () => void
}

const roles = [
  {
    id: "mentee",
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
    id: "mentor",
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
  // {
  //   id: "volunteer",
  //   name: "Voluntário",
  //   description: "Desejo contribuir com atividades voluntárias e causas sociais",
  //   icon: Heart,
  //   color: "bg-purple-100 text-purple-800",
  //   benefits: [
  //     "Participar de projetos sociais",
  //     "Registrar horas de voluntariado",
  //     "Conectar com ONGs",
  //     "Fazer a diferença na comunidade",
  //   ],
  // },
]

export function RoleSelectionModal({ open, onClose }: RoleSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const { user, refreshProfile } = useAuth()
  const supabase = createClient()

  const handleRoleSelection = async () => {
    if (!selectedRole || !user) return

    setIsLoading(true)
    try {
      // Update user profile with selected role
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          role: selectedRole,
          status: selectedRole === "mentor" ? "pending" : "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (profileError) throw profileError

      // Assign role in user_roles table
      const { data: roleData, error: roleQueryError } = await supabase
        .from("roles")
        .select("id")
        .eq("name", selectedRole)
        .single()

      if (roleQueryError) throw roleQueryError

      // Remove existing primary roles
      await supabase.from("user_roles").update({ is_primary: false }).eq("user_id", user.id)

      // Check if role already exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .eq("role_id", roleData.id)
        .single()

      if (existingRole) {
        // Update existing role to primary
        await supabase.from("user_roles").update({ is_primary: true }).eq("id", existingRole.id)
      } else {
        // Create new role assignment
        await supabase.from("user_roles").insert({
          user_id: user.id,
          role_id: roleData.id,
          is_primary: true,
        })
      }

      toast.success("Perfil atualizado com sucesso!")
      onClose()
    } catch (error) {
      console.error("Erro ao selecionar role:", error)
      toast.error("Erro ao atualizar perfil. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Escolha seu perfil</DialogTitle>
          <DialogDescription>
            Selecione como você gostaria de participar da nossa plataforma. Você poderá alterar isso depois.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
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
              {/* <CardContent>
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
              </CardContent> */}
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleRoleSelection} disabled={!selectedRole || isLoading}>
            {isLoading ? "Salvando..." : "Confirmar Seleção"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
