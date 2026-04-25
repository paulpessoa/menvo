"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback
} from "react"

/**
 * Interface de Feature Flags (Padrão Sincronizado com o Banco).
 */
export interface FeatureFlags {
  waiting_list_flag: boolean
  new_mentorship_flag: boolean
  feedback_app_flag: boolean
  maintenance_mode_flag: boolean
}

/**
 * Defaults seguros.
 */
export const DEFAULT_FLAGS: FeatureFlags = {
  waiting_list_flag: false,
  new_mentorship_flag: false,
  feedback_app_flag: false,
  maintenance_mode_flag: false
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

export function FeatureFlagsProvider({
  children
}: {
  children: React.ReactNode
}) {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFlags = useCallback(async () => {
    try {
      const response = await fetch("/api/feature-flags")
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      
      setFlags(data.flags)
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
    throw new Error("useFeatureFlags must be used within a FeatureFlagsProvider")
  return context
}

export function useFeatureFlag(flagName: keyof FeatureFlags): boolean {
  const { flags } = useFeatureFlags()
  return flags[flagName] ?? DEFAULT_FLAGS[flagName]
}
