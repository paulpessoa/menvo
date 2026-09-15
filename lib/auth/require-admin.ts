import { NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"

export type AdminRole = "admin" | "moderator"

interface AuthorizedAdmin {
  userId: string
  role: AdminRole
}

interface GuardFailure {
  response: NextResponse
}

type GuardResult = { ok: true; admin: AuthorizedAdmin } | ({ ok: false } & GuardFailure)

/**
 * Authorizes the caller of an admin API route.
 *
 * The Next.js middleware matcher deliberately excludes `/api/*`, so route
 * handlers under `/api/admin` receive no upstream authentication. Every such
 * handler must call this guard before touching a service-role client, which
 * bypasses Row Level Security entirely.
 *
 * @param allowed Roles accepted by the caller route. Defaults to `admin` only.
 */
export async function requireAdmin(
  allowed: AdminRole[] = ["admin"]
): Promise<GuardResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Não autenticado", code: "UNAUTHORIZED" },
        { status: 401 }
      )
    }
  }

  // A user may hold several roles, so never collapse this with `.single()`.
  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", user.id)
    .returns<{ roles: { name: string } | null }[]>()

  const roleNames = (roleRows ?? [])
    .map(row => row.roles?.name)
    .filter((name): name is string => Boolean(name))

  const matched = allowed.find(role => roleNames.includes(role))

  if (!matched) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Acesso negado", code: "FORBIDDEN" },
        { status: 403 }
      )
    }
  }

  return { ok: true, admin: { userId: user.id, role: matched } }
}
