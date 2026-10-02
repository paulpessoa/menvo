"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth"
import { driver, DriveStep } from "driver.js"
import "driver.js/dist/driver.css"

export function useOnboarding(tourId: string, steps: DriveStep[], onComplete?: () => void) {
  const { profile, isAuthenticated, refreshProfile } = useAuth()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !isAuthenticated || !profile) return

    const flags = profile.onboarding_flags || {}
    
    // If already seen, don't show
    if (flags[tourId]) return

    // Small delay to ensure the UI is fully rendered
    const timer = setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        doneBtnText: 'Concluir',
        nextBtnText: 'Próximo',
        prevBtnText: 'Anterior',
        steps,
        onDestroyed: async () => {
          try {
            await fetch('/api/profile/onboarding', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ flag: tourId, value: new Date().toISOString() })
            })
            await refreshProfile()
            if (onComplete) onComplete()
          } catch (e) {
            console.error('Failed to save onboarding state:', e)
          }
        }
      })

      driverObj.drive()
    }, 1000)

    return () => clearTimeout(timer)
  }, [isClient, isAuthenticated, profile, tourId, steps, onComplete, refreshProfile])
}
