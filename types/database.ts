export type UserRole = "pending" | "mentee" | "mentor" | "admin" | "volunteer" | "moderator"
export type UserStatus = "pending" | "active" | "suspended" | "rejected"
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
          slug: string | null
          avatar_url: string | null
          bio: string | null
          location: string | null
          role: UserRole
          status: UserStatus
          is_volunteer: boolean
          email_confirmed_at: string | null
          verified_at: string | null
          verified_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          slug?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          role?: UserRole
          status?: UserStatus
          is_volunteer?: boolean
          email_confirmed_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          first_name?: string | null
          last_name?: string | null
          slug?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          role?: UserRole
          status?: UserStatus
          is_volunteer?: boolean
          email_confirmed_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          updated_at?: string
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
    }
    Enums: {
      user_role: UserRole
      user_status: UserStatus
      session_status: SessionStatus
      validation_status: ValidationStatus
      notification_type: NotificationType
      app_permission: AppPermission
    }
  }
}
