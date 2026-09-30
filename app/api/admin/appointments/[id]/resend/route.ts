import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth/require-admin"
import { logAdminAction } from "@/lib/audit-logger"
import { adminResendAppointmentSchema } from "@/lib/schemas/appointment"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import {
  resendConfirmation,
  resendMentorRequest,
  toAdminErrorResponse
} from "@/lib/services/appointments/admin-appointments.service"

/**
 * POST /api/admin/appointments/:id/resend  { target: "mentor_request" | "confirmation" }
 * Reenvia o e-mail de pedido ao mentor ou a confirmação a mentor e mentorado.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { id } = await params
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "ID de agendamento inválido", code: "INVALID_ID" }, { status: 400 })
  }

  const parsed = adminResendAppointmentSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Dados inválidos", code: "VALIDATION_ERROR" },
      { status: 400 }
    )
  }

  try {
    const client = createServiceRoleClient()
    const { target } = parsed.data

    const result =
      target === "mentor_request"
        ? await resendMentorRequest(client, id)
        : await resendConfirmation(client, id)

    await logAdminAction(
      guard.admin.userId,
      "appointment_resend",
      { appointment_id: id, target, ...result },
      undefined,
      undefined,
      request
    )

    return NextResponse.json({ success: true, target, ...result }, { status: 200 })
  } catch (error) {
    const { body, status } = toAdminErrorResponse(error)
    return NextResponse.json(body, { status })
  }
}
