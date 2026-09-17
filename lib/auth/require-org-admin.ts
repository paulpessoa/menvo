import { NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"

interface AuthorizedOrgAdmin {
  userId: string
  organizationId: string
  isPlatformAdmin: boolean
}

type GuardResult =
  | { ok: true; admin: AuthorizedOrgAdmin }
  | { ok: false; response: NextResponse }

/**
 * Authorizes the caller of an org-scoped admin API route (`/dashboard/org`).
 * A caller passes if they are either:
 *  - an `organization_members` row with role='admin' for this org, or
 *  - a platform admin (user_roles.role = 'admin'), who can manage any org.
 */
export async function requireOrgAdmin(organizationId: string): Promise<GuardResult> {
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

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", user.id)
    .returns<{ roles: { name: string } | null }[]>()

  const isPlatformAdmin = (roleRows ?? []).some(row => row.roles?.name === "admin")

  if (isPlatformAdmin) {
    return { ok: true, admin: { userId: user.id, organizationId, isPlatformAdmin: true } }
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role, status")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle()

  if ((membership as any)?.role !== "admin" || (membership as any)?.status !== "active") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Acesso negado", code: "FORBIDDEN" },
        { status: 403 }
      )
    }
  }

  return { ok: true, admin: { userId: user.id, organizationId, isPlatformAdmin: false } }
}
