import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticação e permissões
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || !["admin", "moderator"].includes(profile.role)) {
      return NextResponse.json({ error: "Sem permissão para acessar dashboard" }, { status: 403 })
    }

    // Buscar estatísticas
    const [
      { count: totalUsers },
      { count: pendingVerifications },
      { count: totalMentors },
      { count: activeMentors },
      { count: totalVolunteers },
      { count: pendingActivities },
      { count: totalSessions },
      { count: completedSessions },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("verification_status", "pending")
        .eq("role", "mentor"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "mentor"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "mentor").eq("status", "active"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "volunteer"),
      supabase.from("volunteer_activities").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("mentorship_sessions").select("*", { count: "exact", head: true }),
      supabase.from("mentorship_sessions").select("*", { count: "exact", head: true }).eq("status", "completed"),
    ])

    // Buscar atividades recentes
    const { data: recentActivities } = await supabase
      .from("volunteer_activities")
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false })
      .limit(10)

    // Buscar verificações pendentes
    const { data: pendingMentors } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "mentor")
      .eq("verification_status", "pending")
      .order("created_at", { ascending: true })
      .limit(10)

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers || 0,
        pendingVerifications: pendingVerifications || 0,
        totalMentors: totalMentors || 0,
        activeMentors: activeMentors || 0,
        totalVolunteers: totalVolunteers || 0,
        pendingActivities: pendingActivities || 0,
        totalSessions: totalSessions || 0,
        completedSessions: completedSessions || 0,
      },
      recentActivities: recentActivities || [],
      pendingMentors: pendingMentors || [],
    })
  } catch (error) {
    console.error("Erro no dashboard:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
