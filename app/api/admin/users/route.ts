import { NextRequest } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { handleApiError, successResponse } from "@/lib/api/error-handler"
import { requireAdmin } from "@/lib/auth/require-admin"
import { adminUsersQuerySchema } from "@/lib/schemas/admin-users"
import { adminForbiddenResponse } from "@/lib/services/admin/assert-admin"
import { buildAdminUsersService } from "@/lib/services/admin/users.composition"

/**
 * Lista paginada de usuários para o painel admin. A rota só autentica (401/403
 * pelo `requireAdmin`), valida a query e delega: a regra e o `assertAdmin`
 * ficam no service.
 */
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const query = adminUsersQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams)
    )

    const supabase = await createClient()
    const result = await buildAdminUsersService(supabase).listUsers(query)

    return successResponse(result)
  } catch (error) {
    return adminForbiddenResponse(error) ?? handleApiError(error)
  }
}
