"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Users, GraduationCap, Heart, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import type { Database } from "@/types/database"

type UserRole = Database["public"]["Enums"]["user_role"]

interface RoleOption {
  value: UserRole
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const roleOptions: RoleOption[] = [
  {
    value: "mentee",
    label: "Mentee",
    description: "Quero encontrar mentores e receber orientação profissional",
    icon: GraduationCap,
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    value: "mentor",
    label: "Mentor",
    description: "Quero compartilhar conhecimento e orientar outros profissionais",
    icon: Users,
    color: "bg-green-100 text-green-800 border-green-200",
  },
  {
    value: "volunteer",
    label: "Voluntário",
    description: "Quero contribuir com atividades voluntárias e projetos sociais",
    icon: Heart,
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
]

interface RoleSelectionModalProps {
  open: boolean
  onClose?: () => void
}

export function RoleSelectionModal({ open, onClose }: RoleSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { updateRole } = useAuth()

  const handleSubmit = async () => {
    if (!selectedRole) {
      toast.error("Por favor, selecione uma opção")
      return
    }

    setIsSubmitting(true)

    try {
      await updateRole(selectedRole)
      toast.success("Perfil atualizado com sucesso!")
      onClose?.()
    } catch (error) {
      console.error("Erro ao atualizar role:", error)
      toast.error("Erro ao atualizar perfil. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Como você quer usar a plataforma?</DialogTitle>
          <DialogDescription>
            Selecione a opção que melhor descreve seu objetivo na plataforma. Você poderá alterar isso depois se
            necessário.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {roleOptions.map((option) => {
            const Icon = option.icon
            const isSelected = selectedRole === option.value

            return (
              <Card
                key={option.value}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? "ring-2 ring-primary shadow-md" : ""
                }`}
                onClick={() => setSelectedRole(option.value)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${option.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{option.label}</CardTitle>
                      </div>
                    </div>
                    {isSelected && <Badge variant="default">Selecionado</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-sm">{option.description}</CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button onClick={handleSubmit} disabled={!selectedRole || isSubmitting} className="min-w-[120px]">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Continuar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
