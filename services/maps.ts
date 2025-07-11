export interface GeocodeResult {
  lat: number
  lng: number
  formatted_address: string
  place_id: string
}

export interface ReverseGeocodeResult {
  formatted_address: string
  place_id: string
  address_components: any[]
}

export const mapsService = {
  // Geocoding: converter endereço em coordenadas
  geocode: async (address: string): Promise<GeocodeResult | null> => {
    try {
      const response = await fetch("/api/maps/geocode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address }),
      })

      const result = await response.json()

      if (result.success) {
        return result.data
      } else {
        console.error("Erro no geocoding:", result.error)
        return null
      }
    } catch (error) {
      console.error("Erro ao fazer geocoding:", error)
      return null
    }
  },

  // Reverse Geocoding: converter coordenadas em endereço
  reverseGeocode: async (lat: number, lng: number): Promise<ReverseGeocodeResult | null> => {
    try {
      const response = await fetch("/api/maps/reverse-geocode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lat, lng }),
      })

      const result = await response.json()

      if (result.success) {
        return result.data
      } else {
        console.error("Erro no reverse geocoding:", result.error)
        return null
      }
    } catch (error) {
      console.error("Erro ao fazer reverse geocoding:", error)
      return null
    }
  },

  // Obter localização atual do usuário
  getCurrentLocation: (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.error("Geolocalização não é suportada pelo navegador")
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Erro ao obter localização:", error)
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutos
        },
      )
    })
  },

  // Calcular distância entre dois pontos (fórmula de Haversine)
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371 // Raio da Terra em km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  },
}
