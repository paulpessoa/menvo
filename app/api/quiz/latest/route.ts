import { NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { buildQuizService } from "@/lib/services/quiz/quiz.composition"

/**
 * GET /api/quiz/latest - the caller's own most recent quiz response, used by
 * `/dashboard/mentee` to show whether the diagnostic was already done.
 *
 * The e-mail is taken from the session, never from a query param: RLS
 * ("Users read own quiz responses") already limits reads to
 * `email = auth.jwt() ->> 'email'`, but deriving it here too means an
 * authenticated caller can't even ask for someone else's e-mail by mistake.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  try {
    const summary = await buildQuizService(supabase).getLatest(user.email)
    return NextResponse.json({ summary })
  } catch (error) {
    console.error("[GET /api/quiz/latest] Erro ao buscar última resposta:", (error as Error).message)
    return NextResponse.json({ error: "Não foi possível carregar o questionário" }, { status: 500 })
  }
}
