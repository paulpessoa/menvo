"use client"

import { useState } from "react"
import { toast } from "sonner"

export interface DetectedLocation {
  city: string
  state: string
  country: string
}

/**
 * Browser geolocation + OpenStreetMap reverse geocoding. Kept as a hook so the
 * profile form doesn't carry ~50 lines of permission/error handling inline.
 */
export function useDetectLocation(onDetected: (location: DetectedLocation) => void) {
  const [isDetecting, setIsDetecting] = useState(false)

  const detect = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Geolocalização não é suportada pelo seu navegador.")
      return
    }

    setIsDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=10&addressdetails=1`,
            { headers: { "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8" } }
          )
          if (!response.ok) throw new Error("Falha na geocodificação")
          const addr = (await response.json()).address ?? {}
          onDetected({
            city: addr.city || addr.town || addr.municipality || addr.village || addr.county || "",
            state: addr.state || "",
            country: addr.country || "",
          })
          toast.success("Localização preenchida!")
        } catch {
          toast.error("Não foi possível identificar sua cidade. Preencha manualmente.")
        } finally {
          setIsDetecting(false)
        }
      },
      (error) => {
        setIsDetecting(false)
        toast.error(
          error.code === error.PERMISSION_DENIED
            ? "Permissão de localização negada pelo navegador."
            : "Não foi possível obter a sua localização."
        )
      },
      { timeout: 10000, enableHighAccuracy: false }
    )
  }

  return { detect, isDetecting }
}
