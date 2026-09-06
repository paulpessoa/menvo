import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/utils/supabase/server"

/**
 * Server-side logout route handler.
 * Invalidates session on Supabase and clears HTTP auth cookies.
 */
export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient()

    // 1. Invalida sessão no Supabase Auth
    await supabase.auth.signOut().catch((err) => {
      console.warn("[Logout Route] Supabase signOut warning (proceeding with cookie cleanup):", err)
    })

    // 2. Remove explicitamente todos os cookies de autenticação do Supabase
    const allCookies = cookieStore.getAll()
    allCookies.forEach((cookie) => {
      if (
        cookie.name.startsWith("sb-") ||
        cookie.name.includes("auth-token") ||
        cookie.name.includes("supabase") ||
        cookie.name === "menvo_session"
      ) {
        cookieStore.delete({
          name: cookie.name,
          path: "/",
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Logout Route] Error signing out on server:", error)
    return NextResponse.json({
      success: true,
      warning: "Server signOut failed, local cleanup advised"
    })
  }
}
