"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback
} from "react"

import { FeatureFlags, DEFAULT_FLAGS } from "./feature-flags-server"
export type { FeatureFlags }
export { DEFAULT_FLAGS }

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
      // 🚀 CACHE BUSTING: Adicionamos um timestamp para garantir que o navegador não cacheie o GET
      const response = await fetch(`/api/feature-flags?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
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

