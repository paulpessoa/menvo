import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { mentor_id, scheduled_at, duration_minutes, mentorship_topics, notes_mentee } = body

    if (!mentor_id || !scheduled_at) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Criar agendamento
    const { data: appointment, error: insertError } = await supabase
      .from("appointments")
      .insert({
        mentor_id,
        mentee_id: user.id,
        scheduled_at,
        duration_minutes: duration_minutes || 60,
        mentorship_topics: mentorship_topics || [],
        notes_mentee: notes_mentee || "",
        status: "pending"
      })
      .select(`
        *,
        mentor:profiles!mentor_id(full_name, avatar_url, email),
        mentee:profiles!mentee_id(full_name, avatar_url, email)
      `)
      .returns<any[]>()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ success: true, appointment }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
