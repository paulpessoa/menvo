export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = "pending" | "mentee" | "mentor" | "admin" | "volunteer" | "moderator"
export type UserStatus = "pending" | "active" | "suspended" | "rejected"
export type VerificationStatus = "pending" | "verified" | "rejected"
export type SessionStatus = "pending" | "confirmed" | "completed" | "cancelled" | "rejected"
export type VolunteerActivityStatus = "pending" | "validated" | "rejected"
export type NotificationType = "info" | "success" | "warning" | "error"
export type NotificationCategory = "system" | "mentorship" | "verification" | "volunteer"
export type AvailabilityStatus = "available" | "busy" | "unavailable"

export interface Profile {
  id: string
  created_at: string
  updated_at: string
  email?: string | null
  first_name?: string | null
  last_name?: string | null
  full_name?: string | null
  avatar_url?: string | null
  bio?: string | null
  location?: string | null
  linkedin_url?: string | null
  personal_website_url?: string | null
  portfolio_url?: string | null
  presentation_video_url?: string | null
  slug?: string | null
  current_position?: string | null
  current_company?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  latitude?: number | null
  longitude?: number | null
  role: UserRole
  status: UserStatus
  verification_status: VerificationStatus
  verified_by?: string | null
  verified_at?: string | null
  verification_notes?: string | null
  expertise_areas?: string[] | null
  topics?: string[] | null
  inclusion_tags?: string[] | null
  languages?: string[] | null
  mentorship_approach?: string | null
  what_to_expect?: string | null
  ideal_mentee?: string | null
  cv_url?: string | null
}

export interface MentorProfile {
  id: string
  user_id: string
  availability?: AvailabilityStatus | null
  hourly_rate?: number | null
  languages?: string[] | null
  timezone?: string | null
  meeting_preferences?: Json | null
  created_at: string
  updated_at: string
}

export interface MentorshipSession {
  id: string
  mentor_id: string
  mentee_id: string
  title: string
  description?: string | null
  scheduled_at: string
  duration_minutes?: number | null
  status?: SessionStatus | null
  meeting_url?: string | null
  notes?: string | null
  feedback_mentor?: string | null
  feedback_mentee?: string | null
  rating_mentor?: number | null
  rating_mentee?: number | null
  created_at: string
  updated_at: string
}

export interface VolunteerActivity {
  id: string
  user_id: string
  title: string
  activity_type: string
  description?: string | null
  hours: number
  date: string
  location?: string | null
  organization?: string | null
  evidence_url?: string | null
  status?: VolunteerActivityStatus | null
  validated_by?: string | null
  validated_at?: string | null
  validation_notes?: string | null
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  created_at: string
  type: NotificationType
  category: NotificationCategory
  read: boolean
  data?: Json | null
}
