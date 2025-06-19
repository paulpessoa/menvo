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
}

export class GoogleMapsService {
  private static apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!
  private static isLoaded = false
  private static loadPromise: Promise<void> | null = null

  // Carregar a API do Google Maps
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

      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places`
      script.async = true
      script.defer = true

      script.onload = () => {
        this.isLoaded = true
        resolve()
      }

      script.onerror = () => {
        reject(new Error("Failed to load Google Maps API"))
      }

      document.head.appendChild(script)
    })

    return this.loadPromise
  }

  // Geocodificação - converter endereço em coordenadas
  static async geocode(address: string): Promise<GeocodeResult[]> {
    await this.loadGoogleMaps()

    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder()

      geocoder.geocode({ address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results) {
          const formattedResults: GeocodeResult[] = results.map((result) => ({
            formatted_address: result.formatted_address,
            geometry: {
              location: {
                lat: result.geometry.location.lat(),
                lng: result.geometry.location.lng(),
              },
            },
            place_id: result.place_id,
            types: result.types,
          }))
          resolve(formattedResults)
        } else {
          reject(new Error(`Geocoding failed: ${status}`))
        }
      })
    })
  }

  // Geocodificação reversa - converter coordenadas em endereço
  static async reverseGeocode(location: Location): Promise<GeocodeResult[]> {
    await this.loadGoogleMaps()

    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder()
      const latLng = new google.maps.LatLng(location.lat, location.lng)

      geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results) {
          const formattedResults: GeocodeResult[] = results.map((result) => ({
            formatted_address: result.formatted_address,
            geometry: {
              location: {
                lat: result.geometry.location.lat(),
                lng: result.geometry.location.lng(),
              },
            },
            place_id: result.place_id,
            types: result.types,
          }))
          resolve(formattedResults)
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`))
        }
      })
    })
  }

  // Buscar lugares próximos
  static async searchNearbyPlaces(location: Location, radius: number, type?: string): Promise<PlaceResult[]> {
    await this.loadGoogleMaps()

    return new Promise((resolve, reject) => {
      const map = new google.maps.Map(document.createElement("div"))
      const service = new google.maps.places.PlacesService(map)

      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(location.lat, location.lng),
        radius,
        type: type as any,
      }

      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const formattedResults: PlaceResult[] = results.map((place) => ({
            place_id: place.place_id!,
            formatted_address: place.vicinity || "",
            name: place.name || "",
            geometry: {
              location: {
                lat: place.geometry!.location!.lat(),
                lng: place.geometry!.location!.lng(),
              },
            },
            types: place.types || [],
          }))
          resolve(formattedResults)
        } else {
          reject(new Error(`Places search failed: ${status}`))
        }
      })
    })
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

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}
