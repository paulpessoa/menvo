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

    let driverObj: any = null
    let completed = false

    // Small delay to ensure the UI is fully rendered
    const timer = setTimeout(() => {
      driverObj = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        overlayColor: 'rgba(0, 117, 133, 0.6)',
        doneBtnText: 'Concluir',
        nextBtnText: 'Próximo',
        prevBtnText: 'Anterior',
        steps,
        onDestroyStarted: () => {
          if (!driverObj.hasNextStep() || driverObj.isLastStep?.()) {
            completed = true
          }
          driverObj.destroy()
        },
        onDestroyed: async () => {
          if (!completed) return

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

    return () => {
      clearTimeout(timer)
      if (driverObj) {
        driverObj.destroy()
      }
    }
  }, [isClient, isAuthenticated, profile, tourId, steps, onComplete, refreshProfile])
}
