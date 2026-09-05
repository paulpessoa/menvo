import { NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"

/**
 * Server-side logout route handler.
 * Invalidates session on Supabase and clears HTTP auth cookies.
 */
export async function POST() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Logout Route] Error signing out on server:", error)
    // Always return 200 so client can finalize cleanup
    return NextResponse.json({
      success: true,
      warning: "Server signOut failed, local cleanup advised"
    })
  }
}
