export type UserRole = "pending" | "mentee" | "mentor" | "admin" | "volunteer" | "moderator"
export type UserStatus =
  | "pending_role_selection"
  | "incomplete"
  | "validation_pending"
  | "active"
  | "suspended"
  | "rejected"
export type SessionStatus = "scheduled" | "completed" | "cancelled" | "no_show"
export type ValidationStatus = "pending" | "validated" | "rejected" | "suspended"
export type NotificationType =
  | "session_reminder"
  | "session_cancelled"
  | "new_message"
  | "profile_verified"
  | "activity_validated"
  | "system_update"
export type AppPermission =
  | "view_mentors"
  | "book_sessions"
  | "provide_mentorship"
  | "manage_availability"
  | "admin_users"
  | "admin_verifications"
  | "admin_system"
  | "validate_activities"
  | "moderate_content"

export type user_role = UserRole
export type user_status = UserStatus

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          location: string | null
          city: string | null
          state: string | null
          country: string | null
          timezone: string | null
          job_title: string | null
          company: string | null
          experience_years: number | null
          session_price_usd: number | null
          phone: string | null
          linkedin_url: string | null
          github_url: string | null
          twitter_url: string | null
          website_url: string | null
          languages: string[] | null
          mentorship_topics: string[] | null
          inclusive_tags: string[] | null
          expertise_areas: string[] | null
          availability_status: Database["public"]["Enums"]["availability_status"] | null
          verified: boolean
          verification_status: Database["public"]["Enums"]["verification_status"]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          timezone?: string | null
          job_title?: string | null
          company?: string | null
          experience_years?: number | null
          session_price_usd?: number | null
          phone?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          twitter_url?: string | null
          website_url?: string | null
          languages?: string[] | null
          mentorship_topics?: string[] | null
          inclusive_tags?: string[] | null
          expertise_areas?: string[] | null
          availability_status?: Database["public"]["Enums"]["availability_status"] | null
          verified?: boolean
          verification_status?: Database["public"]["Enums"]["verification_status"]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          timezone?: string | null
          job_title?: string | null
          company?: string | null
          experience_years?: number | null
          session_price_usd?: number | null
          phone?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          twitter_url?: string | null
          website_url?: string | null
          languages?: string[] | null
          mentorship_topics?: string[] | null
          inclusive_tags?: string[] | null
          expertise_areas?: string[] | null
          availability_status?: Database["public"]["Enums"]["availability_status"] | null
          verified?: boolean
          verification_status?: Database["public"]["Enums"]["verification_status"]
          created_at?: string
          updated_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
        }
      }
      user_roles: {
        Row: {
          user_id: string
          role_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          role_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          role_id?: string
        }
      }
      role_permissions: {
        Row: {
          id: number
          role: UserRole
          permission: AppPermission
        }
        Insert: {
          role: UserRole
          permission: AppPermission
        }
        Update: {
          role?: UserRole
          permission?: AppPermission
        }
      }
      volunteer_activity_types: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          color?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          icon?: string | null
          color?: string | null
        }
      }
      volunteer_activities: {
        Row: {
          id: string
          user_id: string
          activity_type_id: string | null
          title: string
          description: string | null
          hours: number
          date: string
          location: string | null
          organization: string | null
          evidence_url: string | null
          status: ValidationStatus
          validated_by: string | null
          validated_at: string | null
          validation_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type_id?: string | null
          title: string
          description?: string | null
          hours: number
          date: string
          location?: string | null
          organization?: string | null
          evidence_url?: string | null
          status?: ValidationStatus
          validated_by?: string | null
          validated_at?: string | null
          validation_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          activity_type_id?: string | null
          title?: string
          description?: string | null
          hours?: number
          date?: string
          location?: string | null
          organization?: string | null
          evidence_url?: string | null
          status?: ValidationStatus
          validated_by?: string | null
          validated_at?: string | null
          validation_notes?: string | null
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
          duration?: number
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
      notifications: {
        Row: {
          id: string
          user_id: string
          type: NotificationType
          title: string
          message: string
          data: Record<string, any> | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: NotificationType
          title: string
          message: string
          data?: Record<string, any> | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          read_at?: string | null
        }
      }
      mentor_verification: {
        Row: {
          id: string
          mentor_id: string
          verification_type: string
          status: string
          verified_by: string | null
          verification_notes: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          mentor_id: string
          verification_type: string
          status?: string
          verified_by?: string | null
          verification_notes?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: string
          verified_by?: string | null
          verification_notes?: string | null
          completed_at?: string | null
          updated_at?: string
        }
      }
      mentors: {
        Row: {
          id: string
          user_id: string
          title: string | null
          company: string | null
          bio: string | null
          status: string
          verified_at: string | null
          verified_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          company?: string | null
          bio?: string | null
          status?: string
          verified_at?: string | null
          verified_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string | null
          company?: string | null
          bio?: string | null
          status?: string
          verified_at?: string | null
          verified_by?: string | null
          updated_at?: string
        }
      }
      mentor_profiles: {
        Row: {
          id: string
          user_id: string
          current_position: string | null
          current_company: string | null
          years_experience: number | null
          education_level: string | null
          languages: string[] | null
          mentor_skills: string[] | null
          availability: Database["public"]["Enums"]["availability_status"]
          rating: number | null
          total_sessions: number | null
          verified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          current_position?: string | null
          current_company?: string | null
          years_experience?: number | null
          education_level?: string | null
          languages?: string[] | null
          mentor_skills?: string[] | null
          availability?: Database["public"]["Enums"]["availability_status"]
          rating?: number | null
          total_sessions?: number | null
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          current_position?: string | null
          current_company?: string | null
          years_experience?: number | null
          education_level?: string | null
          languages?: string[] | null
          mentor_skills?: string[] | null
          availability?: Database["public"]["Enums"]["availability_status"]
          rating?: number | null
          total_sessions?: number | null
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Enums: {
      user_role: "pending" | "mentee" | "mentor" | "admin"
      verification_status: "pending" | "verified" | "rejected"
      availability_status: "available" | "busy" | "unavailable"
      session_status: SessionStatus
      validation_status: ValidationStatus
      notification_type: NotificationType
      app_permission: AppPermission
    }
  }
}
