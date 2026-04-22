export interface Location {
  lat: number
  lng: number
}

export interface PlaceResult {
  place_id: string
  formatted_address: string
  name: string
  geometry: {
    location: Location
  }
  types: string[]
}

export interface GeocodeResult {
  formatted_address: string
  geometry: {
    location: Location
  }
  place_id: string
  types: string[]
  address_components: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
}

export class GoogleMapsService {
  private static isLoaded = false
  private static loadPromise: Promise<void> | null = null

  // Carregar a API do Google Maps (apenas para componentes que precisam do mapa visual)
  static async loadGoogleMaps(): Promise<void> {
    if (this.isLoaded) return
    if (this.loadPromise) return this.loadPromise

    this.loadPromise = new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("Google Maps can only be loaded in the browser"))
        return
      }

      if (window.google && window.google.maps) {
        this.isLoaded = true
        resolve()
        return
      }

      // Para componentes que precisam do mapa visual, você precisará implementar
      // um endpoint server-side que forneça uma URL assinada ou usar uma abordagem diferente
      reject(new Error("Google Maps visual components require server-side implementation"))
    })

    return this.loadPromise
  }

  // Geocodificação - usar o serviço server-side
  static async geocode(address: string): Promise<GeocodeResult[]> {
    try {
      const response = await fetch("/api/maps/geocode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Geocoding failed")
      }

      const data = await response.json()
      return data.results
    } catch (error) {
      console.error("Geocoding error:", error)
      throw error
    }
  }

  // Geocodificação reversa - usar o serviço server-side
  static async reverseGeocode(location: Location): Promise<GeocodeResult[]> {
    try {
      const response = await fetch("/api/maps/reverse-geocode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lat: location.lat, lng: location.lng }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Reverse geocoding failed")
      }

      const data = await response.json()
      return data.results
    } catch (error) {
      console.error("Reverse geocoding error:", error)
      throw error
    }
  }

  // Obter localização atual do usuário
  static async getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"))
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
          reject(new Error(`Geolocation error: ${error.message}`))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000,
        },
      )
    })
  }

  // Calcular distância entre dois pontos
  static calculateDistance(point1: Location, point2: Location): number {
    const R = 6371 // Raio da Terra em km
    const dLat = this.toRadians(point2.lat - point1.lat)
    const dLng = this.toRadians(point2.lng - point1.lng)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) *
        Math.cos(this.toRadians(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Extrair componentes do endereço
  static extractAddressComponents(result: GeocodeResult) {
    const components = result.address_components
    const extracted = {
      street_number: "",
      route: "",
      neighborhood: "",
      city: "",
      state: "",
      country: "",
      postal_code: "",
    }

    components.forEach((component) => {
      const types = component.types

      if (types.includes("street_number")) {
        extracted.street_number = component.long_name
      }
      if (types.includes("route")) {
        extracted.route = component.long_name
      }
      if (types.includes("sublocality") || types.includes("neighborhood")) {
        extracted.neighborhood = component.long_name
      }
      if (types.includes("locality") || types.includes("administrative_area_level_2")) {
        extracted.city = component.long_name
      }
      if (types.includes("administrative_area_level_1")) {
        extracted.state = component.long_name
      }
      if (types.includes("country")) {
        extracted.country = component.long_name
      }
      if (types.includes("postal_code")) {
        extracted.postal_code = component.long_name
      }
    })

    return extracted
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  // Serviço simplificado para Google Maps sem API key no cliente
  static googleMapsService = {
    // Gerar URL para Google Maps
    generateMapsUrl: (address: string): string => {
      const encodedAddress = encodeURIComponent(address)
      return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
    },

    // Gerar URL para direções
    generateDirectionsUrl: (origin: string, destination: string): string => {
      const encodedOrigin = encodeURIComponent(origin)
      const encodedDestination = encodeURIComponent(destination)
      return `https://www.google.com/maps/dir/?api=1&origin=${encodedOrigin}&destination=${encodedDestination}`
    },

    // Gerar URL para Street View
    generateStreetViewUrl: (lat: number, lng: number): string => {
      return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`
    },

    // Validar coordenadas
    isValidCoordinate: (lat: number, lng: number): boolean => {
      return typeof lat === "number" && typeof lng === "number" && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
    },
  }
}
