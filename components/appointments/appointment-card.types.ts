import type { AppointmentStatus } from "@/lib/domain/appointments/appointment-status.entity"

/** Feedback row embedded in the list response; only the reviewer matters to the card. */
export interface AppointmentFeedbackItem {
  id: string | number
  reviewer_id: string
}

/** The other end of a session, as embedded by `/api/appointments/list`. */
export interface AppointmentParty {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  linkedin_url?: string | null
  slug?: string | null
}

export interface Appointment {
  id: string | number
  scheduled_at: string
  duration_minutes: number
  status: AppointmentStatus
  notes_mentee?: string
  notes_mentor?: string
  google_meet_link?: string
  cancellation_reason?: string
  cancelled_at?: string
  cancelled_by?: string
  feedbacks?: AppointmentFeedbackItem[]
  mentor: AppointmentParty
  mentee: AppointmentParty
}
