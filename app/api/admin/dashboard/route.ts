import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { hasPermission } from "@/lib/auth/rbac"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Verificar se é admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || !hasPermission(profile.role, "admin.all")) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Buscar estatísticas
    const [
      { count: totalUsers },
      { count: totalMentors },
      { count: totalMentees },
      { count: totalVolunteers },
      { count: pendingVerifications },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "mentor"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "mentee"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "volunteer"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("verification_status", "pending"),
    ])

    // Buscar total de horas de voluntariado
    const { data: volunteerHours } = await supabase
      .from("volunteer_activities")
      .select("hours")
      .eq("status", "validated")

    const totalVolunteerHours = volunteerHours?.reduce((sum, activity) => sum + activity.hours, 0) || 0

    // Buscar atividades recentes
    const { data: recentActivities } = await supabase
      .from("volunteer_activities")
      .select(`
        id,
        title,
        activity_type,
        created_at,
        profiles!volunteer_activities_user_id_fkey(first_name, last_name)
      `)
      .order("created_at", { ascending: false })
      .limit(10)

    const formattedActivities =
      recentActivities?.map((activity) => ({
        id: activity.id,
        type: "volunteer_activity",
        description: `${activity.profiles?.first_name} ${activity.profiles?.last_name} registrou: ${activity.title}`,
        created_at: activity.created_at,
      })) || []

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalMentors: totalMentors || 0,
      totalMentees: totalMentees || 0,
      totalVolunteers: totalVolunteers || 0,
      pendingVerifications: pendingVerifications || 0,
      totalVolunteerHours,
      recentActivities: formattedActivities,
    })
  } catch (error) {
    console.error("Erro ao buscar dashboard:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
