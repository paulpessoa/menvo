import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth/require-admin"
import { logAdminAction } from "@/lib/audit-logger"
import { adminCancelAppointmentSchema } from "@/lib/schemas/appointment"
import { createServiceRoleClient } from "@/lib/utils/supabase/service-role"
import {
  cancelAppointmentAsAdmin,
  toAdminErrorResponse
} from "@/lib/services/appointments/admin-appointments.service"

/**
 * POST /api/admin/appointments/:id/cancel  { reason }
 * Cancela em nome da equipe, avisa mentor e mentorado e remove o evento do calendário.
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

  const parsed = adminCancelAppointmentSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Dados inválidos", code: "VALIDATION_ERROR" },
      { status: 400 }
    )
  }

  try {
    const result = await cancelAppointmentAsAdmin(
      createServiceRoleClient(),
      id,
      guard.admin.userId,
      parsed.data.reason
    )

    await logAdminAction(
      guard.admin.userId,
      "appointment_cancelled",
      { appointment_id: id, reason: parsed.data.reason, ...result },
      undefined,
      undefined,
      request
    )

    return NextResponse.json({ success: true, ...result }, { status: 200 })
  } catch (error) {
    const { body, status } = toAdminErrorResponse(error)
    return NextResponse.json(body, { status })
  }
}
