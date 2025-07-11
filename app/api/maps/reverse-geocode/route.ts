import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { lat, lng } = await request.json()

    if (!lat || !lng) {
      return NextResponse.json({ error: "Latitude e longitude são obrigatórias" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key não configurada" }, { status: 500 })
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === "OK" && data.results.length > 0) {
      const result = data.results[0]
      return NextResponse.json({
        success: true,
        data: {
          formatted_address: result.formatted_address,
          place_id: result.place_id,
          address_components: result.address_components,
        },
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Localização não encontrada",
        },
        { status: 404 },
      )
    }
  } catch (error) {
    console.error("Erro no reverse geocoding:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
