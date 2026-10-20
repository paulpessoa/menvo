import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { toggleFavoriteSchema } from "@/lib/schemas/me"
import { buildMyFavoritesService } from "@/lib/services/me/my-favorites.composition"

/**
 * GET/POST /api/me/favorites - the caller's favorited mentor ids. Replaces
 * `favoritesService`, which read/wrote `user_favorites` straight from the
 * browser with a client-supplied `userId` (docs/COMMUNITY_CONTACT_PLAN.md §13).
 *
 * The user id is always taken from the session, never from the request body:
 * RLS on `user_favorites` should already scope this to `auth.uid()`, but
 * deriving it here too means a caller can't even try to read or write
 * someone else's favorites by passing a different id.
 * Thin on purpose: auth, Zod, service, status.
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

  const outcome = await buildMyFavoritesService(supabase).list(user.id)
  if (outcome.kind === "failed") {
    return NextResponse.json({ error: "Não foi possível carregar os favoritos" }, { status: 500 })
  }

  return NextResponse.json({ favorites: outcome.mentorIds })
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await requireUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const parsed = toggleFavoriteSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
  }

  const outcome = await buildMyFavoritesService(supabase).toggle(user.id, parsed.data)
  if (outcome.kind === "failed") {
    return NextResponse.json({ error: "Não foi possível atualizar os favoritos" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
