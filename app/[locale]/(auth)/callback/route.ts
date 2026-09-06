import { type NextRequest, NextResponse } from "next/server"

/**
 * Redireciona o callback localizado em [locale] para o callback central da API.
 * Isso garante que todas as lógicas de redirecionamento (recovery, roles, etc)
 * fiquem em um único lugar (/api/auth/callback).
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const type = requestUrl.searchParams.get("type")
  const next = requestUrl.searchParams.get("next")
  const tokenHash = requestUrl.searchParams.get("token_hash")
  
  const centralCallbackUrl = new URL("/auth/callback", request.url)
  
  if (code) centralCallbackUrl.searchParams.set("code", code)
  if (type) centralCallbackUrl.searchParams.set("type", type)
  if (next) centralCallbackUrl.searchParams.set("next", next)
  if (tokenHash) centralCallbackUrl.searchParams.set("token_hash", tokenHash)

  return NextResponse.redirect(centralCallbackUrl)
}
