export interface Appointment {
  id: number;
  mentor_id: string;
  mentee_id: string;
  scheduled_at: string;
  duration_minutes: number;
  google_event_id?: string;
  google_meet_link?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes_mentee?: string; // Comentários/notas do mentee ao solicitar
  notes_mentor?: string; // Anotações/notas do mentor ao confirmar
  cancellation_reason?: string; // Motivo do cancelamento
  cancelled_at?: string; // Data/hora do cancelamento
  cancelled_by?: string; // ID de quem cancelou
  created_at: string;
  updated_at?: string;
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