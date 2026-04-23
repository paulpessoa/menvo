
"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { DEFAULT_FLAGS, type FeatureFlags } from "@/lib/constants/feature-flags"

interface FeatureFlagsContextType {
    flags: FeatureFlags
    isLoading: boolean
    error: string | null
    refreshFlags: () => Promise<void>
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined)

export function FeatureFlagsProvider({ children, initialFlags }: { children: React.ReactNode, initialFlags?: Partial<FeatureFlags> }) {
    const [flags, setFlags] = useState<FeatureFlags>(() => ({ ...DEFAULT_FLAGS, ...initialFlags }))
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchFlags = useCallback(async () => {
        try {
            setIsLoading(true)
            const response = await fetch("/api/feature-flags")
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
            const data = await response.json()
            setFlags(prev => ({ ...prev, ...data.flags }))
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
        <FeatureFlagsContext.Provider value={{ flags, isLoading, error, refreshFlags: fetchFlags }}>
            {children}
        </FeatureFlagsContext.Provider>
    )
}

export function useFeatureFlags() {
    const context = useContext(FeatureFlagsContext)
    if (context === undefined) throw new Error("useFeatureFlags must be used within a FeatureFlagsProvider")
    return context
}

export function useFeatureFlag(flagName: keyof FeatureFlags): boolean {
    const { flags } = useFeatureFlags()
    return flags[flagName] ?? DEFAULT_FLAGS[flagName] ?? false
}

/**
 * Helper para verificar flags no servidor (RSC)
 */
export async function getFeatureFlags(): Promise<FeatureFlags> {
    return DEFAULT_FLAGS;
}
