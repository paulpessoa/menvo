import { NextRequest } from "next/server"
import { createClient } from "@/lib/utils/supabase/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { createOrganizationSchema } from "@/lib/schemas/organizations"
import { errorResponse, handleApiError, successResponse } from "@/lib/api/error-handler"

// GET /api/admin/organizations - list every organization (platform admin only)
export async function GET() {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const supabase = await createClient()

    // Aggregates (count) are disabled on Supabase's PostgREST by default,
    // so embed the member ids and count client-side.
    const { data: organizations, error } = await supabase
      .from("organizations" as any)
      .select("*, organization_members(user_id, status)")
      .order("created_at", { ascending: false })

    if (error) throw error

    const withCounts = ((organizations ?? []) as any[]).map(
      ({ organization_members, ...org }) => ({
        ...org,
        member_count: (organization_members ?? []).filter((m: any) => m.status === "active").length
      })
    )

    return successResponse(withCounts)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/admin/organizations - create a new organization (platform admin only)
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const rawBody = await request.json().catch(() => ({}))
    const validation = createOrganizationSchema.safeParse(rawBody)

    if (!validation.success) {
      return errorResponse(
        validation.error.errors[0]?.message || "Dados inválidos",
        "VALIDATION_ERROR",
        400
      )
    }

    const supabase = await createClient()

    const { data: existing } = await supabase
      .from("organizations" as any)
      .select("id")
      .eq("slug", validation.data.slug)
      .maybeSingle()

    if (existing) {
      return errorResponse("Já existe uma organização com esse slug", "CONFLICT", 409)
    }

    const { data: organization, error } = await supabase
      .from("organizations" as any)
      .insert(validation.data as any)
      .select()
      .single()

    if (error) throw error

    return successResponse(organization, "Organização criada com sucesso")
  } catch (error) {
    return handleApiError(error)
  }
}
