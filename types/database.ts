export type UserRole = "mentee" | "mentor" | "admin"
export type UserStatus = "pending" | "active" | "suspended" | "rejected"
export type MentorStatus = "pending_verification" | "verification_scheduled" | "verified" | "rejected" | "suspended"
export type SessionStatus = "scheduled" | "completed" | "cancelled" | "no_show"
export type VerificationStatus = "pending" | "scheduled" | "completed" | "rejected"

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          full_name: string
          avatar_url: string | null
          bio: string | null
          location: string | null
          languages: string[]
          role: UserRole
          status: UserStatus
          created_at: string
          updated_at: string
          last_login: string | null
        }
        Insert: {
          id: string
          email: string
          first_name: string
          last_name: string
          full_name: string
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          languages?: string[]
          role: UserRole
          status?: UserStatus
          created_at?: string
          updated_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          full_name?: string
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          languages?: string[]
          role?: UserRole
          status?: UserStatus
          updated_at?: string
          last_login?: string | null
        }
      }
      mentors: {
        Row: {
          id: string
          user_id: string
          title: string
          company: string | null
          experience_years: number
          expertise_areas: string[]
          topics: string[]
          inclusion_tags: string[]
          linkedin_url: string | null
          portfolio_url: string | null
          academic_background: string | null
          current_work: string | null
          areas_of_interest: string | null
          session_duration: number
          timezone: string
          status: MentorStatus
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
          rating: number
          total_sessions: number
          total_reviews: number
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          company?: string | null
          experience_years: number
          expertise_areas: string[]
          topics: string[]
          inclusion_tags?: string[]
          linkedin_url?: string | null
          portfolio_url?: string | null
          academic_background?: string | null
          current_work?: string | null
          areas_of_interest?: string | null
          session_duration?: number
          timezone: string
          status?: MentorStatus
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          rating?: number
          total_sessions?: number
          total_reviews?: number
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          company?: string | null
          experience_years?: number
          expertise_areas?: string[]
          topics?: string[]
          inclusion_tags?: string[]
          linkedin_url?: string | null
          portfolio_url?: string | null
          academic_background?: string | null
          current_work?: string | null
          areas_of_interest?: string | null
          session_duration?: number
          timezone?: string
          status?: MentorStatus
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          rating?: number
          total_sessions?: number
          total_reviews?: number
          is_available?: boolean
          updated_at?: string
        }
      }
      mentor_verification: {
        Row: {
          id: string
          mentor_id: string
          verification_type: "initial" | "renewal"
          status: VerificationStatus
          scheduled_at: string | null
          completed_at: string | null
          verified_by: string | null
          notes: string | null
          documents_submitted: boolean
          identity_verified: boolean
          expertise_verified: boolean
          background_check: boolean
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          mentor_id: string
          verification_type: "initial" | "renewal"
          status?: VerificationStatus
          scheduled_at?: string | null
          completed_at?: string | null
          verified_by?: string | null
          notes?: string | null
          documents_submitted?: boolean
          identity_verified?: boolean
          expertise_verified?: boolean
          background_check?: boolean
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          verification_type?: "initial" | "renewal"
          status?: VerificationStatus
          scheduled_at?: string | null
          completed_at?: string | null
          verified_by?: string | null
          notes?: string | null
          documents_submitted?: boolean
          identity_verified?: boolean
          expertise_verified?: boolean
          background_check?: boolean
          rejection_reason?: string | null
          updated_at?: string
        }
      }
      mentor_availability: {
        Row: {
          id: string
          mentor_id: string
          day_of_week: number // 0-6 (Sunday-Saturday)
          start_time: string // HH:MM format
          end_time: string // HH:MM format
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          mentor_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          day_of_week?: number
          start_time?: string
          end_time?: string
          is_available?: boolean
          updated_at?: string
        }
      }
      mentorship_sessions: {
        Row: {
          id: string
          mentor_id: string
          mentee_id: string
          scheduled_at: string
          duration: number
          status: SessionStatus
          topics: string[]
          mentee_notes: string | null
          mentor_notes: string | null
          meeting_url: string | null
          completed_at: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          cancelled_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          mentor_id: string
          mentee_id: string
          scheduled_at: string
          duration: number
          status?: SessionStatus
          topics: string[]
          mentee_notes?: string | null
          mentor_notes?: string | null
          meeting_url?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          scheduled_at?: string
          duration?: number
          status?: SessionStatus
          topics?: string[]
          mentee_notes?: string | null
          mentor_notes?: string | null
          meeting_url?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          session_id: string
          reviewer_id: string
          reviewed_id: string
          rating: number
          comment: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          reviewer_id: string
          reviewed_id: string
          rating: number
          comment?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          rating?: number
          comment?: string | null
          is_public?: boolean
          updated_at?: string
        }
      }
      admin_actions: {
        Row: {
          id: string
          admin_id: string
          action_type: string
          target_type: "user" | "mentor" | "session" | "review"
          target_id: string
          details: Record<string, any>
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action_type: string
          target_type: "user" | "mentor" | "session" | "review"
          target_id: string
          details: Record<string, any>
          reason?: string | null
          created_at?: string
        }
        Update: {
          admin_id?: string
          action_type?: string
          target_type?: "user" | "mentor" | "session" | "review"
          target_id?: string
          details?: Record<string, any>
          reason?: string | null
        }
      }
    }
    Views: {
      verified_mentors: {
        Row: {
          id: string
          user_id: string
          full_name: string
          avatar_url: string | null
          bio: string | null
          location: string | null
          languages: string[]
          title: string
          company: string | null
          experience_years: number
          expertise_areas: string[]
          topics: string[]
          inclusion_tags: string[]
          rating: number
          total_sessions: number
          total_reviews: number
          is_available: boolean
        }
      }
    }
  }
}
