import { NextResponse } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { createOrganizationsRepository } from "@/lib/repositories/organizations.repository"

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
 *  - a platform admin (user_roles.role = 'admin'), who can manage any org, or
 *  - an ACTIVE admin of this org, asked through the `is_org_admin` RPC (via the
 *    repository, so no route or guard queries `organization_members` itself).
 * Why the RPC: it is the same rule the RLS policies use, so the guard and the
 * database cannot disagree about who counts as an org admin.
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

  const repo = createOrganizationsRepository(supabase)

  const roleNames = (await repo.listUserRoleNames([user.id])).get(user.id) ?? []
  if (roleNames.includes("admin")) {
    return { ok: true, admin: { userId: user.id, organizationId, isPlatformAdmin: true } }
  }

  if (!(await repo.isOrgAdmin(organizationId))) {
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
