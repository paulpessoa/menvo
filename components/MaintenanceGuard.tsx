"use client"

import { useFeatureFlag } from "@/lib/feature-flags"
import { useAuth } from "@/lib/auth"
import { Hammer } from "lucide-react"

/**
 * MaintenanceGuard
 * Intercepta o acesso à plataforma se o modo de manutenção estiver ativo.
 * Administradores ignoram esta trava para poderem realizar testes e ajustes.
 */
export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const isMaintenance = useFeatureFlag("maintenance_mode_flag")
  const { user, cachedRoles } = useAuth()
  
  const isAdmin = cachedRoles?.role === 'admin'

  if (isMaintenance && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-6">
        <div className="bg-amber-100 p-6 rounded-full">
          <Hammer className="h-16 w-10 text-amber-600 animate-bounce" />
        </div>
        <h1 className="text-4xl font-black text-gray-900">Voltamos logo!</h1>
        <p className="text-xl text-gray-600 max-w-md">
          Estamos realizando uma manutenção rápida para melhorar sua experiência. 
          A plataforma Menvo estará de volta em instantes.
        </p>
        <div className="text-sm text-gray-400 italic">
          Obrigado pela paciência.
        </div>
      </div>
    )
  }

  return <>{children}</>
}
