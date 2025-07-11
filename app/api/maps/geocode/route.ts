import { type NextRequest, NextResponse } from "next/server"

export interface Location {
  lat: number
  lng: number
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

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Google Maps API key not configured" }, { status: 500 })
    }

    const encodedAddress = encodeURIComponent(address)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== "OK") {
      return NextResponse.json({ error: `Geocoding failed: ${data.status}` }, { status: 400 })
    }

    const results: GeocodeResult[] = data.results.map((result: any) => ({
      formatted_address: result.formatted_address,
      geometry: {
        location: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        },
      },
      place_id: result.place_id,
      types: result.types,
      address_components: result.address_components.map((component: any) => ({
        long_name: component.long_name,
        short_name: component.short_name,
        types: component.types,
      })),
    }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Geocoding error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
