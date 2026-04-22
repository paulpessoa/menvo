/**
 * Mentorship and Appointments Types
 */

export type AppointmentStatus = 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';

export interface Appointment {
  id: number;
  mentor_id: string;
  mentee_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  topic: string | null;
  notes_mentee: string | null;
  notes_mentor: string | null;
  meeting_link: string | null;
  google_event_id: string | null;
  google_meet_link: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MentorAvailability {
  id: number;
  mentor_id: string;
  day_of_week: number; // 0-6
  start_time: string; // HH:MM:SS
  end_time: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AvailableTimeSlot {
  time: string;
  available: boolean;
  date?: string;
  datetime?: string;
}

/**
 * Joined type for UI display
 */
export interface AppointmentWithProfiles extends Appointment {
  mentor: {
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  } | null;
  mentee: {
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  } | null;
}
