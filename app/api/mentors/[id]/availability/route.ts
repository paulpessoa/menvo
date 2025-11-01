import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id: mentorId } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") // 'config' ou 'slots'

    // Se format=config, retornar configuração semanal (para sidebar)
    if (format === "config") {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      const { data: availability, error } = await supabase
        .from("mentor_availability")
        .select("*")
        .eq("mentor_id", mentorId)
        .order("day_of_week")
        .order("start_time")

      if (error) {
        console.error("[AVAILABILITY] Error fetching config:", error)
        return NextResponse.json(
          { error: "Failed to fetch availability" },
          { status: 500 }
        )
      }

      return NextResponse.json(availability || [])
    }

    // Caso contrário, redirecionar para API de slots disponíveis
    const startDate =
      searchParams.get("start_date") || new Date().toISOString().split("T")[0]
    const endDate =
      searchParams.get("end_date") ||
      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]

    const apiUrl = new URL("/api/appointments/availability", request.url)
    apiUrl.searchParams.set("mentor_id", mentorId)
    apiUrl.searchParams.set("start_date", startDate)
    apiUrl.searchParams.set("end_date", endDate)

    const response = await fetch(apiUrl.toString(), {
      headers: request.headers
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("[AVAILABILITY] Erro inesperado:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
