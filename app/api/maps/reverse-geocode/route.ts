import { type NextRequest, NextResponse } from "next/server"
import type { GeocodeResult } from "../geocode/route"

export async function POST(request: NextRequest) {
  try {
    const { lat, lng } = await request.json()

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ error: "Valid latitude and longitude are required" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Google Maps API key not configured" }, { status: 500 })
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== "OK") {
      return NextResponse.json({ error: `Reverse geocoding failed: ${data.status}` }, { status: 400 })
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
    console.error("Reverse geocoding error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
