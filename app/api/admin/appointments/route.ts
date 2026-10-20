import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/require-admin"
import { createClient } from "@/lib/utils/supabase/server"
import { buildAdminAppointmentsDeps } from "@/lib/services/admin/ops.composition"
import {
  listAdminAppointments,
  toAdminErrorResponse
} from "@/lib/services/appointments/admin-appointments.service"

/**
 * GET /api/admin/appointments?status=pending&q=maria
 * Lista todas as sessões de mentoria (qualquer status) para a equipe.
 */
export async function GET(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { searchParams } = new URL(request.url)

  try {
    const result = await listAdminAppointments(buildAdminAppointmentsDeps(await createClient()), {
      status: searchParams.get("status"),
      q: searchParams.get("q")
    })
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    const { body, status } = toAdminErrorResponse(error)
    return NextResponse.json(body, { status })
  }
}
