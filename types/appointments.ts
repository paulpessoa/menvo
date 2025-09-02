export interface Appointment {
  id: number;
  mentor_id: string;
  mentee_id: string;
  scheduled_at: string;
  duration_minutes: number;
  google_event_id?: string;
  google_meet_link?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}

export interface CreateAppointmentRequest {
  mentor_id: string;
  scheduled_at: string;
  duration_minutes?: number;
  message?: string;
}

export interface AppointmentWithProfiles extends Appointment {
  mentor: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    avatar_url?: string;
  };
  mentee: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface MentorAvailability {
  id: number;
  mentor_id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, etc.
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  created_at: string;
}

export interface AvailableTimeSlot {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  datetime: string; // ISO string
}