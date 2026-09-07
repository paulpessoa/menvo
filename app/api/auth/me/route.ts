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

    // Buscar perfil e papéis
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*, user_roles(roles(name))")
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
      user,
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
