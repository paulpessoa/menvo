import type { z } from "zod"
import type { AppointmentListItem } from "@/lib/domain/appointments/appointment.entity"
import type { FeedbackListItem } from "@/lib/repositories/appointment-feedbacks.repository"
import {
  actionResponseSchema,
  appointmentListItemSchema,
  availabilityResponseSchema,
  cancelResponseSchema,
  confirmResponseSchema,
  feedbackItemSchema,
  listAppointmentsResponseSchema,
  listFeedbacksQuerySchema,
  scheduleRequestSchema,
} from "./appointment-responses"

// Drift em tempo de compilação: se a entity (o que o repository devolve) e o schema
// de saída (o que o contrato promete) se separarem, o `tsc` falha aqui.
export const _listItemMatchesEntity = (item: AppointmentListItem): z.infer<typeof appointmentListItemSchema> => item
export const _feedbackMatchesRepository = (item: FeedbackListItem): z.infer<typeof feedbackItemSchema> => item

const ID = "11111111-1111-4111-8111-111111111111"
const party = { id: "u1", full_name: "Ana", email: "ana@x.co", avatar_url: null, linkedin_url: null }

describe("appointment response schemas", () => {
  it("accepts a list item with both parties and a feedback pointer", () => {
    const item = {
      id: ID,
      mentor_id: ID,
      mentee_id: ID,
      scheduled_at: "2026-10-25T15:00:00Z",
      duration_minutes: 45,
      google_meet_link: null,
      status: "confirmed",
      created_at: "2026-10-20T10:00:00Z",
      message: "Quero orientação",
      topic: null,
      cancellation_reason: null,
      cancelled_by: null,
      mentor: party,
      mentee: party,
      feedbacks: [{ id: "f1", reviewer_id: "u1" }],
    }
    expect(listAppointmentsResponseSchema.parse({ appointments: [item], count: 1 }).count).toBe(1)
  })

  it("rejects a list item with a status the database cannot hold", () => {
    const bad = { status: "rejected" }
    expect(appointmentListItemSchema.safeParse(bad).success).toBe(false)
  })

  it("accepts the three confirm responses (confirmed, no calendar, already confirmed)", () => {
    expect(
      confirmResponseSchema.safeParse({ success: true, googleEventId: "e", googleMeetLink: "https://m", calendarError: null, message: "ok" }).success
    ).toBe(true)
    expect(
      confirmResponseSchema.safeParse({ success: true, googleEventId: null, googleMeetLink: null, calendarError: "faltando", message: "ok" }).success
    ).toBe(true)
    expect(confirmResponseSchema.safeParse({ success: true, message: "já", alreadyConfirmed: true }).success).toBe(true)
  })

  it("never carries private notes in a feedback item", () => {
    const parsed = feedbackItemSchema.parse({
      id: "f1",
      rating: 5,
      public_feedback: "ótimo",
      status: "pending",
      created_at: "2026-10-20T10:00:00Z",
      rejection_reason: null,
      private_notes: "segredo",
      mentee: { full_name: "Bia", email: "b@x.co" },
      mentor: null,
    })
    expect(parsed).not.toHaveProperty("private_notes")
  })

  it("covers cancel, action, availability and the feedback query", () => {
    expect(cancelResponseSchema.safeParse({ success: true, message: "Agendamento cancelado com sucesso" }).success).toBe(true)
    expect(actionResponseSchema.safeParse({ success: true, status: "confirmed", message: "ok" }).success).toBe(true)
    expect(actionResponseSchema.safeParse({ success: true, status: "completed", message: "ok" }).success).toBe(false)
    expect(
      availabilityResponseSchema.safeParse({
        success: true,
        availableSlots: [{ date: "2026-10-26", time: "15:00", start_time: "15:00", end_time: "15:45", day_of_week: 1, datetime: "2026-10-26T18:00:00Z" }],
        totalSlots: 1,
      }).success
    ).toBe(true)
    expect(listFeedbacksQuerySchema.safeParse({ type: "sent" }).success).toBe(true)
    expect(listFeedbacksQuerySchema.safeParse({ type: "other" }).success).toBe(false)
  })

  it("scheduleRequestSchema accepts the camelCase body the booking modal sends and enforces the reason length", () => {
    const body = {
      mentorId: ID,
      requestedDate: "2026-10-26",
      requestedStartTime: "15:00",
      duration: 45,
      message: "Quero orientação sobre transição de carreira",
    }
    expect(scheduleRequestSchema.safeParse(body).success).toBe(true)
    expect(scheduleRequestSchema.safeParse({ ...body, message: "curto" }).success).toBe(false)
  })
})
