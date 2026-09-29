import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { z } from "zod"

/**
 * GET/POST /api/me/favorites - the caller's favorited mentor ids. Replaces
 * `favoritesService`, which read/wrote `user_favorites` straight from the
 * browser with a client-supplied `userId` (docs/COMMUNITY_CONTACT_PLAN.md §13).
 *
 * The user id is always taken from the session, never from the request body:
 * RLS on `user_favorites` should already scope this to `auth.uid()`, but
 * deriving it here too means a caller can't even try to read or write
 * someone else's favorites by passing a different id.
 */
async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET() {
  const { supabase, user } = await requireUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("user_favorites")
    .select("mentor_id")
    .eq("user_id", user.id)

  if (error) {
    console.error("[GET /api/me/favorites] Erro:", error.message)
    return NextResponse.json({ error: "Não foi possível carregar os favoritos" }, { status: 500 })
  }

  return NextResponse.json({ favorites: (data || []).map((f) => f.mentor_id) })
}

const toggleSchema = z.object({
  mentorId: z.string().uuid(),
  action: z.enum(["add", "remove"]),
})

export async function POST(request: NextRequest) {
  const { supabase, user } = await requireUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const parsed = toggleSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
  }
  const { mentorId, action } = parsed.data

  const { error } =
    action === "add"
      ? await supabase.from("user_favorites").insert({ user_id: user.id, mentor_id: mentorId } as any)
      : await supabase.from("user_favorites").delete().eq("user_id", user.id).eq("mentor_id", mentorId)

  if (error) {
    console.error("[POST /api/me/favorites] Erro:", error.message)
    return NextResponse.json({ error: "Não foi possível atualizar os favoritos" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
