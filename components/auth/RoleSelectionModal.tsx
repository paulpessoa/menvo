"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, GraduationCap, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/utils/supabase/client"
import { toast } from "sonner"

interface RoleSelectionModalProps {
  open: boolean
  onClose: () => void
  userId: string
  onSuccess?: () => void
}

const roles = [
  {
    id: "mentee",
    name: "Mentorado",
    description: "Busco orientação e acompanhamento para crescer profissionalmente",
    icon: Users,
    color: "bg-blue-100 text-blue-800",
  },
  {
    id: "mentor",
    name: "Mentor",
    description: "Quero compartilhar conhecimento e ajudar outros profissionais",
    icon: GraduationCap,
    color: "bg-green-100 text-green-800",
  },
]

export function RoleSelectionModal({ open, onClose, userId, onSuccess }: RoleSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleRoleSelection = async () => {
    if (!selectedRole || !userId) return

    setIsLoading(true)
    try {
      // 1. Buscar ID da role
      const { data: roleData, error: roleQueryError } = await supabase
        .from("roles")
        .select("id")
        .eq("name", selectedRole)
        .single()

      if (roleQueryError) throw roleQueryError

      // 2. Criar atribuição de role
      const { error: insertError } = await (supabase
        .from("user_roles") as any)
        .insert({
          user_id: userId,
          role_id: (roleData as any).id
        })

      if (insertError) throw insertError

      toast.success("Perfil configurado com sucesso!")
      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      console.error("Erro ao selecionar role:", error)
      toast.error("Erro ao atualizar perfil.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Como você deseja usar a Menvo?</DialogTitle>
          <DialogDescription>
            Escolha o perfil que melhor descreve seu objetivo atual.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {roles.map((role) => (
            <Card
              key={role.id}
              className={`cursor-pointer transition-all hover:shadow-md ${selectedRole === role.id ? "ring-2 ring-primary border-primary" : ""
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
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleRoleSelection} disabled={!selectedRole || isLoading}>
            {isLoading ? "Salvando..." : "Confirmar e Começar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
