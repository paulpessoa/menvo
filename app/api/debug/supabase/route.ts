import { NextResponse } from "next/server"

/**
 * Rota de debug para validar se o servidor enxerga as variáveis do Supabase.
 * Use no Postman: GET /api/debug/supabase
 * TODO: remover após diagnosticar o ambiente.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY

  return NextResponse.json({
    hasUrl: Boolean(url),
    hasAnonKey: Boolean(anon),
    hasServiceRoleKey: Boolean(service),
    urlPreview: url ? url.replace(/(https:\/\/)(.*)(\.supabase\.co)/, "$1***$3") : null,
    anonPreview: anon ? anon.slice(0, 8) + "...len=" + anon.length : null,
    note: "Se hasUrl ou hasAnonKey estiver false, configure as variáveis de ambiente.",
  })
}
