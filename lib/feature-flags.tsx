"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

// Types for feature flags
export interface FeatureFlags {
    waitingListEnabled: boolean
    feedbackEnabled: boolean
    maintenanceMode: boolean
    newUserRegistration: boolean
    mentorVerification: boolean
    [key: string]: boolean
}

// Default feature flags (fallbacks)
const DEFAULT_FLAGS: FeatureFlags = {
    waitingListEnabled: false,
    feedbackEnabled: true,
    maintenanceMode: false,
    newUserRegistration: true,
    mentorVerification: true,
}

// Context
interface FeatureFlagsContextType {
    flags: FeatureFlags
    isLoading: boolean
    error: string | null
    refreshFlags: () => Promise<void>
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined)

// Provider component
interface FeatureFlagsProviderProps {
    children: React.ReactNode
    initialFlags?: Partial<FeatureFlags>
}

export function FeatureFlagsProvider({ children, initialFlags }: FeatureFlagsProviderProps) {
    const [flags, setFlags] = useState<FeatureFlags>({ ...DEFAULT_FLAGS, ...initialFlags })
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchFlags = async () => {
        try {
            setIsLoading(true)
            setError(null)

            const response = await fetch("/api/feature-flags", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                throw new Error(`Failed to fetch feature flags: ${response.status}`)
            }

            const data = await response.json()

            // Merge with defaults to ensure all flags exist
            const mergedFlags = { ...DEFAULT_FLAGS, ...data.flags }
            setFlags(mergedFlags)
        } catch (err) {
            console.error("Error fetching feature flags:", err)
            setError(err instanceof Error ? err.message : "Unknown error")
            // Keep using default flags on error
            setFlags(DEFAULT_FLAGS)
        } finally {
            setIsLoading(false)
        }
    }

    const refreshFlags = async () => {
        await fetchFlags()
    }

    useEffect(() => {
        fetchFlags()
    }, [])

    const value: FeatureFlagsContextType = {
        flags,
        isLoading,
        error,
        refreshFlags,
    }

    return (
        <FeatureFlagsContext.Provider value={value}>
            {children}
        </FeatureFlagsContext.Provider>
    )
}

// Hook to use feature flags
export function useFeatureFlags() {
    const context = useContext(FeatureFlagsContext)

    if (context === undefined) {
        throw new Error("useFeatureFlags must be used within a FeatureFlagsProvider")
    }

    return context
}

// Helper hook for individual flags
export function useFeatureFlag(flagName: keyof FeatureFlags): boolean {
    const { flags } = useFeatureFlags()
    return flags[flagName] ?? DEFAULT_FLAGS[flagName] ?? false
}

// Helper function to check flags server-side
export async function getFeatureFlags(): Promise<FeatureFlags> {
    try {
        const flags: FeatureFlags = {
            waitingListEnabled: process.env.NEXT_PUBLIC_FEATURE_WAITING_LIST === "true",
            feedbackEnabled: process.env.NEXT_PUBLIC_FEATURE_FEEDBACK !== "false", // default true
            maintenanceMode: process.env.NEXT_PUBLIC_FEATURE_MAINTENANCE_MODE === "true",
            newUserRegistration: process.env.NEXT_PUBLIC_FEATURE_NEW_USER_REGISTRATION !== "false", // default true
            mentorVerification: process.env.NEXT_PUBLIC_FEATURE_MENTOR_VERIFICATION !== "false", // default true
        }

        return { ...DEFAULT_FLAGS, ...flags }
    } catch (error) {
        console.error("Error getting feature flags:", error)
        return DEFAULT_FLAGS
    }
}