"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { UserType } from "@/hooks/useSignupForm"
import { useRoleSelection } from "@/hooks/useRoleSelection"

interface RoleSelectionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RoleSelectionModal({ isOpen, onClose }: RoleSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserType>("mentee")
  const { user } = useAuth()
  const { updateRole, isUpdating } = useRoleSelection()

  const handleRoleSelection = () => {
    if (!selectedRole || !user) return
    
    updateRole(selectedRole)
    onClose()
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escolha seu perfil</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card
            className={`cursor-pointer transition-colors ${selectedRole === "mentee" ? "ring-2 ring-primary" : ""}`}
            onClick={() => setSelectedRole("mentee")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Mentee
              </CardTitle>
              <CardDescription>Busco orientação e desenvolvimento profissional</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className={`cursor-pointer transition-colors ${selectedRole === "mentor" ? "ring-2 ring-primary" : ""}`}
            onClick={() => setSelectedRole("mentor")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Mentor
              </CardTitle>
              <CardDescription>Quero compartilhar conhecimento e orientar outros profissionais</CardDescription>
            </CardHeader>
          </Card>

          <Button onClick={handleRoleSelection} disabled={!selectedRole || isUpdating} className="w-full">
            {isUpdating ? (
              <span className="flex items-center">
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Salvando...
              </span>
            ) : (
              "Continuar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
