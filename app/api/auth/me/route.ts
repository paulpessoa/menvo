import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Obter usuário atual
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({
        user: null,
        profile: null,
        authenticated: false,
      })
    }

const PROFILE_COLUMNS = `
  id, email, first_name, last_name, full_name, avatar_url, slug, verified, 
  bio, expertise_areas, linkedin_url, created_at, updated_at, age, city, state, country, 
  timezone, languages, job_title, company, experience_years, mentorship_topics, 
  inclusive_tags, availability_status, github_url, twitter_url, website_url, phone, 
  average_rating, total_reviews, total_sessions, is_volunteer, cv_url, address, 
  portfolio_url, mentorship_approach, what_to_expect, ideal_mentee, free_topics, 
  chat_enabled, profile_visibility, mentorship_guidelines, location, academic_level, 
  institution, course, expected_graduation, mentee_status, show_in_community, 
  is_pending_mentor, learning_goals
`.trim()

    // Buscar perfil e papéis
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(`${PROFILE_COLUMNS}, user_roles(roles(name))`)
      .eq("id", user.id)
      .maybeSingle()

    if (profileError) {
      console.error("⚠️ Erro ao buscar perfil:", profileError)
    }

    const roleNames: string[] =
      (profile as any)?.user_roles
        ?.map((ur: any) => ur.roles?.name)
        .filter(Boolean) || []

    const profileRole = (profile as any)?.user_role || null
    if (roleNames.length === 0 && profileRole) {
      roleNames.push(profileRole)
    }

    let primaryRole: string | null = null
    if (roleNames.includes("admin") || profileRole === "admin") primaryRole = "admin"
    else if (roleNames.includes("mentor") || profileRole === "mentor") primaryRole = "mentor"
    else if (roleNames.includes("mentee") || profileRole === "mentee") primaryRole = "mentee"
    else if (roleNames.length > 0) primaryRole = roleNames[0]

    const isVerified = (profile as any)?.is_verified || (profile as any)?.verification_status === "approved" || false
    const isPending = (profile as any)?.verification_status === "pending"

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      profile: profile || null,
      role: primaryRole,
      roles: roleNames,
      isVerified,
      isPending,
      authenticated: true
    })
  } catch (error) {
    console.error("💥 Erro interno:", error)
    return NextResponse.json({
      user: null,
      profile: null,
      role: null,
      roles: [],
      isVerified: false,
      isPending: false,
      authenticated: false
    })
  }
}
