"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback
} from "react"
import type { Database } from "@/lib/types/supabase"

/**
 * Interface única para Feature Flags da plataforma.
 * Nomes padronizados em camelCase conforme as diretrizes de design.
 */
export interface FeatureFlags {
  waitingListEnabled: boolean
  feedbackEnabled: boolean
  maintenanceMode: boolean
  newUserRegistration: boolean
  mentorVerification: boolean
  newMentorshipUx: boolean
  [key: string]: boolean | undefined
}

/**
 * Fallbacks seguros (Hardcoded).
 * Esta é a base que garante que o app não quebre se a API falhar.
 * O banco de dados é a fonte soberana e sempre sobrescreverá estes valores.
 */
export const DEFAULT_FLAGS: FeatureFlags = {
  waitingListEnabled: false,
  feedbackEnabled: true,
  maintenanceMode: false,
  newUserRegistration: true,
  mentorVerification: true,
  newMentorshipUx: false
}


interface FeatureFlagsContextType {
  flags: FeatureFlags
  isLoading: boolean
  error: string | null
  refreshFlags: () => Promise<void>
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(
  undefined
)

/**
 * FeatureFlagsProvider
 * Provedor de estado global para flags. Centraliza a busca na nossa API.
 * Estrutura preparada para integração com LaunchDarkly ou similares:
 * Basta trocar a lógica de fetch para consumir o SDK do provedor externo.
 */
export function FeatureFlagsProvider({
  children,
  initialFlags
}: {
  children: React.ReactNode
  initialFlags?: Partial<FeatureFlags>
}) {
  const [flags, setFlags] = useState<FeatureFlags>(() => ({
    ...DEFAULT_FLAGS,
    ...initialFlags
  }))
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFlags = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/feature-flags")
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      setFlags((prev) => ({ ...prev, ...data.flags }))
    } catch (err) {
      console.error("Error fetching feature flags:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFlags()
  }, [fetchFlags])

  return (
    <FeatureFlagsContext.Provider
      value={{ flags, isLoading, error, refreshFlags: fetchFlags }}
    >
      {children}
    </FeatureFlagsContext.Provider>
  )
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext)
  if (context === undefined)
    throw new Error(
      "useFeatureFlags must be used within a FeatureFlagsProvider"
    )
  return context
}

/**
 * useFeatureFlag (Hook Principal)
 * Use este hook em qualquer componente para ler uma flag.
 */
export function useFeatureFlag(flagName: keyof FeatureFlags): boolean {
  const { flags } = useFeatureFlags()
  return flags[flagName] ?? DEFAULT_FLAGS[flagName] ?? false
}

/**
 * getFeatureFlags (Servidor)
 * Helper para verificar flags no servidor (Server Components).
 */
export async function getFeatureFlags(): Promise<FeatureFlags> {
  return DEFAULT_FLAGS
}
