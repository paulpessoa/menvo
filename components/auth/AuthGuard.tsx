"use client"

import { useAuth } from "@/hooks/useAuth"
import { VerificationPendingBanner } from "./VerificationPendingBanner"
import { RoleSelectionModal } from "./RoleSelectionModal"
import { ProfileCompletionModal } from "./ProfileCompletionModal"
import type { ReactNode } from "react"

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { 
    loading, 
    needsRoleSelection,
    needsProfileCompletion, 
    needsVerification 
  } = useAuth()

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      {/* Conteúdo principal - sempre renderizado */}
      {children}

      {/* Banners e modais - renderizados condicionalmente */}
      {needsVerification && <VerificationPendingBanner />}
      {needsRoleSelection && (
        <RoleSelectionModal 
          isOpen={true} 
          onClose={() => {}} // Modal não pode ser fechado até role ser selecionada
        />
      )}
      {needsProfileCompletion && (
        <ProfileCompletionModal 
          isOpen={true} 
          onClose={() => {}} // Modal não pode ser fechado até perfil ser completado
        />
      )}
    </>
  )
}
