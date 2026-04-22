import { createClient } from "@/lib/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")
    const next = searchParams.get("next") || "/dashboard"

    if (code) {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error) {
        // 1. Obter o usuário
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          return NextResponse.redirect(`${origin}/login?error=user_not_found`)
        }

        // 2. Buscar o perfil e a role do usuário
        const { data: profile } = await supabase
          .from("profiles")
          .select("*, user_roles!inner(roles(name))")
          .eq("id", user.id)
          .returns<any>()
          .maybeSingle()

        if (!profile) {
          return NextResponse.redirect(`${origin}/setup-profile?next=${next}`)
        }

        const roles = profile.user_roles?.map((ur: any) => ur.roles?.name) || []
        
        if (roles.includes("admin")) {
            const adminNext = next === '/dashboard' ? '/dashboard/admin' : next
            return NextResponse.redirect(`${origin}${adminNext.startsWith('/') ? '' : '/'}${adminNext}`)
        }
        
        return NextResponse.redirect(`${origin}${next.startsWith('/') ? '' : '/'}${next}`)
      }
    }

    // Retorno em caso de erro no código ou na troca
    return NextResponse.redirect(`${origin}/auth/auth-error`)
  } catch (error) {
    console.error("Auth callback error:", error)
    return NextResponse.redirect(`${new URL(request.url).origin}/auth/auth-error`)
  }
}
