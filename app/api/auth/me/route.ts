import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { MENTOR_PROFILE_EMBED, withMentorFields } from "@/lib/services/mentors/mentor-profile-fields"
import { MENTEE_PROFILE_EMBED, withMenteeFields } from "@/lib/services/mentees/mentee-profile-fields"
import { cvLink } from "@/lib/services/mentees/cv-storage"

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

    // Campos de mentor e verificação vêm de mentor_profiles (embed), achatados
    // de volta no perfil por withMentorFields para as telas não mudarem.
    const PROFILE_COLUMNS =
      "id, email, first_name, last_name, full_name, avatar_url, slug, bio, expertise_areas, linkedin_url, created_at, updated_at, city, state, country, timezone, languages, job_title, company, mentorship_topics, github_url, website_url, phone, portfolio_url, onboarding_flags" as const

    // Buscar perfil e papéis
    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select(`${PROFILE_COLUMNS}, ${MENTOR_PROFILE_EMBED}, ${MENTEE_PROFILE_EMBED}, user_roles(roles(name))` as const)
      .eq("id", user.id)
      .maybeSingle()

    const profile = profileRow ? withMenteeFields(withMentorFields(profileRow)) : null

    // cv_url não é legível pelo cliente do usuário (só via função); o próprio
    // usuário pode ver o seu.
    if (profile) {
      const { data: cvUrl } = await supabase.rpc("profile_cv_url", { p_user_id: user.id })
      profile.cv_url = cvLink(user.id, cvUrl)
    }

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

    const isVerified = profile?.verified ?? false
    const isPending = profile?.is_pending_mentor ?? false

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
