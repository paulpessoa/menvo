import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import { CV_BUCKET, cvStoragePath } from "@/lib/services/mentees/cv-storage"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Entrega o currículo de `userId` pelo domínio do Menvo, sem expor o endereço
 * do Supabase nem um token ao navegador.
 *
 * A permissão é conferida a cada acesso pela função `profile_cv_url`, com a
 * sessão de quem pede (próprio, admin ou mentor com mentoria em comum); se
 * ela não devolver nada, a resposta é 404 para não revelar se o arquivo existe.
 * Só depois disso o service role baixa o arquivo do bucket privado.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  if (!UUID_PATTERN.test(userId)) {
    return NextResponse.json({ error: "Currículo não encontrado" }, { status: 404 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Faça login para ver o currículo" }, { status: 401 })
  }

  const { data: stored, error: accessError } = await supabase.rpc("profile_cv_url", { p_user_id: userId })
  const path = accessError ? null : cvStoragePath(stored, userId)
  if (!path) {
    return NextResponse.json({ error: "Currículo não encontrado" }, { status: 404 })
  }

  const { data: file, error: downloadError } = await createServiceRoleClient()
    .storage.from(CV_BUCKET)
    .download(path)

  if (downloadError || !file) {
    console.error("[cv] download failed:", downloadError?.message)
    return NextResponse.json({ error: "Currículo não encontrado" }, { status: 404 })
  }

  return new NextResponse(file.stream(), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="curriculo.pdf"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
