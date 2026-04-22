import { createClient } from "@/lib/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") || "/dashboard"
  
  // Redireciona para o callback root que agora é o cérebro único
  const targetUrl = new URL("/auth/callback", origin)
  if (code) targetUrl.searchParams.set("code", code)
  targetUrl.searchParams.set("next", next)
  
  return NextResponse.redirect(targetUrl)
}
