import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

/**
 * Root callback route to handle redirects from Supabase that don't have a locale.
 * Redirects to the central API callback.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const type = requestUrl.searchParams.get("type")
  const next = requestUrl.searchParams.get("next")
  const tokenHash = requestUrl.searchParams.get("token_hash")
  
  const apiCallbackUrl = new URL("/api/auth/callback", request.url)
  
  if (code) apiCallbackUrl.searchParams.set("code", code)
  if (type) apiCallbackUrl.searchParams.set("type", type)
  if (next) apiCallbackUrl.searchParams.set("next", next)
  if (tokenHash) apiCallbackUrl.searchParams.set("token_hash", tokenHash)

  console.log(`[ROOT CALLBACK] Redirecting to central API: ${apiCallbackUrl.toString()}`)
  
  return NextResponse.redirect(apiCallbackUrl)
}
