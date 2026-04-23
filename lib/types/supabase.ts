export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string | null
          created_at: string
          details: Json | null
          id: number
          reason: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action_type: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: number
          reason?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action_type?: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: number
          reason?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "mentors_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "mentors_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string | null
          details: Json
          id: string
          ip_address: string | null
          target_user_email: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string | null
          details?: Json
          id?: string
          ip_address?: string | null
          target_user_email?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string | null
          details?: Json
          id?: string
          ip_address?: string | null
          target_user_email?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      appointment_feedbacks: {
        Row: {
          appointment_id: number
          created_at: string
          id: string
          private_notes: string | null
          public_feedback: string | null
          rating: number | null
          reviewed_id: string
          reviewer_id: string
          updated_at: string
        }
        Insert: {
          appointment_id: number
          created_at?: string
          id?: string
          private_notes?: string | null
          public_feedback?: string | null
          rating?: number | null
          reviewed_id: string
          reviewer_id: string
          updated_at?: string
        }
        Update: {
          appointment_id?: number
          created_at?: string
          id?: string
          private_notes?: string | null
          public_feedback?: string | null
          rating?: number | null
          reviewed_id?: string
          reviewer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_feedbacks_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_feedbacks_reviewed_id_fkey"
            columns: ["reviewed_id"]
            isOneToOne: false
            referencedRelation: "mentors_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_feedbacks_reviewed_id_fkey"
            columns: ["reviewed_id"]
            isOneToOne: false
            referencedRelation: "mentors_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_feedbacks_reviewed_id_fkey"
            columns: ["reviewed_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_feedbacks_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "mentors_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_feedbacks_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "mentors_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_feedbacks_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          action_token: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          completed_at: string | null
          created_at: string
          cv_type: string | null
          cv_url: string | null
          description: string | null
          duration_minutes: number
          google_event_id: string | null
          google_meet_link: string | null
          id: number
          meeting_link: string | null
          meeting_url: string | null
          mentee_id: string
          mentor_id: string
          mentor_response: string | null
          message: string | null
          notes_mentee: string | null
          notes_mentor: string | null
          organization_id: string | null
          requested_date: string | null
          requested_end_time: string | null
          requested_start_time: string | null
          responded_at: string | null
          scheduled_at: string
          status: string
          timezone: string | null
          token_expires_at: string | null
          topic: string | null
          updated_at: string
          video_service: string | null
        }
        Insert: {
          action_token?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          created_at?: string
          cv_type?: string | null
          cv_url?: string | null
          description?: string | null
          duration_minutes?: number
          google_event_id?: string | null
          google_meet_link?: string | null
          id?: number
          meeting_link?: string | null
          meeting_url?: string | null
          mentee_id: string
          mentor_id: string
          mentor_response?: string | null
          message?: string | null
          notes_mentee?: string | null
          notes_mentor?: string | null
          organization_id?: string | null
          requested_date?: string | null
          requested_end_time?: string | null
          requested_start_time?: string | null
          responded_at?: string | null
          scheduled_at: string
          status?: string
          timezone?: string | null
          token_expires_at?: string | null
          topic?: string | null
          updated_at?: string
          video_service?: string | null
        }
        Update: {
          action_token?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          created_at?: string
          cv_type?: string | null
          cv_url?: string | null
          description?: string | null
          duration_minutes?: number
          google_event_id?: string | null
          google_meet_link?: string | null
          id?: number
          meeting_link?: string | null
          meeting_url?: string | null
          mentee_id?: string
          mentor_id?: string
          mentor_response?: string | null
          message?: string | null
          notes_mentee?: string | null
          notes_mentor?: string | null
          organization_id?: string | null
          requested_date?: string | null
          requested_end_time?: string | null
          requested_start_time?: string | null
          responded_at?: string | null
          scheduled_at?: string
          status?: string
          timezone?: string | null
          token_expires_at?: string | null
          topic?: string | null
          updated_at?: string
          video_service?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "mentors_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "mentors_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          mentee_id: string
          mentor_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          mentee_id: string
          mentor_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          mentee_id?: string
          mentor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "mentors_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "mentors_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          comment: string | null
          created_at: string | null
          email: string | null
          id: string
          rating: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          rating: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          rating?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      mentor_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: number
          mentor_id: string
          start_time: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: number
          mentor_id: string
          start_time: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: number
          mentor_id?: string
          start_time?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_availability_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_availability_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_availability_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_suggestions: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          free_topics: string[] | null
          id: string
          inclusion_tags: string[] | null
          knowledge_topics: string[] | null
          linkedin_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          suggestion_text: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          free_topics?: string[] | null
          id?: string
          inclusion_tags?: string[] | null
          knowledge_topics?: string[] | null
          linkedin_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          suggestion_text: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          free_topics?: string[] | null
          id?: string
          inclusion_tags?: string[] | null
          knowledge_topics?: string[] | null
          linkedin_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          suggestion_text?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mentor_verification: {
        Row: {
          documents_url: string[] | null
          id: number
          mentor_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: string
          submitted_at: string
        }
        Insert: {
          documents_url?: string[] | null
          id?: number
          mentor_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          submitted_at?: string
        }
        Update: {
          documents_url?: string[] | null
          id?: number
          mentor_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_verification_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_verification_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_verification_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_verification_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "mentors_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_verification_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "mentors_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_verification_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_visibility_settings: {
        Row: {
          created_at: string
          id: string
          mentor_id: string
          updated_at: string
          visibility_scope: string
          visible_to_organizations: string[] | null
        }
        Insert: {
          created_at?: string
          id?: string
          mentor_id: string
          updated_at?: string
          visibility_scope?: string
          visible_to_organizations?: string[] | null
        }
        Update: {
          created_at?: string
          id?: string
          mentor_id?: string
          updated_at?: string
          visibility_scope?: string
          visible_to_organizations?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "mentor_visibility_settings_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: true
            referencedRelation: "mentors_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_visibility_settings_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: true
            referencedRelation: "mentors_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_visibility_settings_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "mentors_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "mentors_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscriptions: {
        Row: {
          consent_given: boolean
          created_at: string
          email: string
          id: string
          marketing_consent: boolean
          name: string | null
          whatsapp: string | null
        }
        Insert: {
          consent_given?: boolean
          created_at?: string
          email: string
          id?: string
          marketing_consent?: boolean
          name?: string | null
          whatsapp?: string | null
        }
        Update: {
          consent_given?: boolean
          created_at?: string
          email?: string
          id?: string
          marketing_consent?: boolean
          name?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      organization_activity_log: {
        Row: {
          activity_type: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          organization_id: string
          target_id: string | null
        }
        Insert: {
          activity_type: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          organization_id: string
          target_id?: string | null
        }
        Update: {
          activity_type?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          target_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "mentors_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "mentors_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_activity_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_activity_log_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "mentors_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_activity_log_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "mentors_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_activity_log_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          activated_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          invitation_token: string | null
          invited_at: string
          invited_by: string | null
          left_at: string | null
          organization_id: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          invitation_token?: string | null
          invited_at?: string
          invited_by?: string | null
          left_at?: string | null
          organization_id: string
          role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          invitation_token?: string | null
          invited_at?: string
          invited_by?: string | null
          left_at?: string | null
          organization_id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "mentors_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "mentors_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mentors_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mentors_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          contact_email: string
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          max_mentees: number | null
          max_mentors: number | null
          max_monthly_appointments: number | null
          name: string
          slug: string
          status: string
          type: string
          updated_at: string
          website: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          max_mentees?: number | null
          max_mentors?: number | null
          max_monthly_appointments?: number | null
          name: string
          slug: string
          status?: string
          type: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          max_mentees?: number | null
          max_mentors?: number | null
          max_monthly_appointments?: number | null
          name?: string
          slug?: string
          status?: string
          type?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "mentors_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "mentors_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          academic_level: string | null
          address: string | null
          age: number | null
          availability_status: string | null
          avatar_url: string | null
          average_rating: number | null
          bio: string | null
          chat_enabled: boolean | null
          city: string | null
          company: string | null
          country: string | null
          course: string | null
          created_at: string
          cv_url: string | null
          email: string
          expected_graduation: string | null
          experience_years: number | null
          expertise_areas: string[] | null
          external_id: string | null
          first_name: string | null
          free_topics: string[] | null
          full_name: string | null
          github_url: string | null
          id: string
          ideal_mentee: string | null
          inclusive_tags: string[] | null
          institution: string | null
          invite_sent_at: string | null
          is_public: boolean | null
          is_volunteer: boolean | null
          job_title: string | null
          languages: string[] | null
          last_name: string | null
          linkedin_url: string | null
          location: string | null
          mentee_status: string | null
          mentorship_approach: string | null
          mentorship_guidelines: string | null
          mentorship_topics: string[] | null
          organization_id: string | null
          origin_platform: string | null
          original_data: Json | null
          phone: string | null
          portfolio_url: string | null
          profile_visibility: string | null
          search_vector: unknown
          session_price_usd: number | null
          show_in_community: boolean | null
          slug: string | null
          state: string | null
          timezone: string | null
          total_reviews: number | null
          total_sessions: number | null
          twitter_url: string | null
          updated_at: string
          verification_notes: string | null
          verification_status: string | null
          verified: boolean
          verified_at: string | null
          website_url: string | null
          what_to_expect: string | null
        }
        Insert: {
          academic_level?: string | null
          address?: string | null
          age?: number | null
          availability_status?: string | null
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          chat_enabled?: boolean | null
          city?: string | null
          company?: string | null
          country?: string | null
          course?: string | null
          created_at?: string
          cv_url?: string | null
          email: string
          expected_graduation?: string | null
          experience_years?: number | null
          expertise_areas?: string[] | null
          external_id?: string | null
          first_name?: string | null
          free_topics?: string[] | null
          full_name?: string | null
          github_url?: string | null
          id: string
          ideal_mentee?: string | null
          inclusive_tags?: string[] | null
          institution?: string | null
          invite_sent_at?: string | null
          is_public?: boolean | null
          is_volunteer?: boolean | null
          job_title?: string | null
          languages?: string[] | null
          last_name?: string | null
          linkedin_url?: string | null
          location?: string | null
          mentee_status?: string | null
          mentorship_approach?: string | null
          mentorship_guidelines?: string | null
          mentorship_topics?: string[] | null
          organization_id?: string | null
          origin_platform?: string | null
          original_data?: Json | null
          phone?: string | null
          portfolio_url?: string | null
          profile_visibility?: string | null
          search_vector?: unknown
          session_price_usd?: number | null
          show_in_community?: boolean | null
          slug?: string | null
          state?: string | null
          timezone?: string | null
          total_reviews?: number | null
          total_sessions?: number | null
          twitter_url?: string | null
          updated_at?: string
          verification_notes?: string | null
          verification_status?: string | null
          verified?: boolean
          verified_at?: string | null
          website_url?: string | null
          what_to_expect?: string | null
        }
        Update: {
          academic_level?: string | null
          address?: string | null
          age?: number | null
          availability_status?: string | null
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          chat_enabled?: boolean | null
          city?: string | null
          company?: string | null
          country?: string | null
          course?: string | null
          created_at?: string
          cv_url?: string | null
          email?: string
          expected_graduation?: string | null
          experience_years?: number | null
          expertise_areas?: string[] | null
          external_id?: string | null
          first_name?: string | null
          free_topics?: string[] | null
          full_name?: string | null
          github_url?: string | null
          id?: string
          ideal_mentee?: string | null
          inclusive_tags?: string[] | null
          institution?: string | null
          invite_sent_at?: string | null
          is_public?: boolean | null
          is_volunteer?: boolean | null
          job_title?: string | null
          languages?: string[] | null
          last_name?: string | null
          linkedin_url?: string | null
          location?: string | null
          mentee_status?: string | null
          mentorship_approach?: string | null
          mentorship_guidelines?: string | null
          mentorship_topics?: string[] | null
          organization_id?: string | null
          origin_platform?: string | null
          original_data?: Json | null
          phone?: string | null
          portfolio_url?: string | null
          profile_visibility?: string | null
          search_vector?: unknown
          session_price_usd?: number | null
          show_in_community?: boolean | null
          slug?: string | null
          state?: string | null
          timezone?: string | null
          total_reviews?: number | null
          total_sessions?: number | null
          twitter_url?: string | null
          updated_at?: string
          verification_notes?: string | null
          verification_status?: string | null
          verified?: boolean
          verified_at?: string | null
          website_url?: string | null
          what_to_expect?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_mentors: {
        Row: {
          areas: string[]
          bio: string | null
          created_at: string | null
          current_mentees: number | null
          id: string
          is_available: boolean | null
          max_mentees: number | null
          name: string
          specialties: string[]
          updated_at: string | null
        }
        Insert: {
          areas: string[]
          bio?: string | null
          created_at?: string | null
          current_mentees?: number | null
          id?: string
          is_available?: boolean | null
          max_mentees?: number | null
          name: string
          specialties: string[]
          updated_at?: string | null
        }
        Update: {
          areas?: string[]
          bio?: string | null
          created_at?: string | null
          current_mentees?: number | null
          id?: string
          is_available?: boolean | null
          max_mentees?: number | null
          name?: string
          specialties?: string[]
          updated_at?: string | null
        }
        Relationships: []
      }
      quiz_responses: {
        Row: {
          ai_analysis: Json | null
          career_moment: string
          created_at: string | null
          current_challenge: string | null
          development_areas: string[]
          email: string
          email_sent: boolean | null
          email_sent_at: string | null
          future_vision: string | null
          id: string
          linkedin_url: string | null
          mentorship_experience: string
          name: string
          personal_life_help: string | null
          processed_at: string | null
          score: number | null
          share_knowledge: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          career_moment: string
          created_at?: string | null
          current_challenge?: string | null
          development_areas: string[]
          email: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          future_vision?: string | null
          id?: string
          linkedin_url?: string | null
          mentorship_experience: string
          name: string
          personal_life_help?: string | null
          processed_at?: string | null
          score?: number | null
          share_knowledge?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          career_moment?: string
          created_at?: string | null
          current_challenge?: string | null
          development_areas?: string[]
          email?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          future_vision?: string | null
          id?: string
          linkedin_url?: string | null
          mentorship_experience?: string
          name?: string
          personal_life_help?: string | null
          processed_at?: string | null
          score?: number | null
          share_knowledge?: string | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string | null
          id: string
          mentor_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mentor_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mentor_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mentors_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mentors_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          id: number
          role_id: number | null
          user_id: string
        }
        Insert: {
          assigned_at?: string
          id?: number
          role_id?: number | null
          user_id: string
        }
        Update: {
          assigned_at?: string
          id?: number
          role_id?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mentors_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "mentors_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_logs: {
        Row: {
          action: string
          admin_id: string | null
          id: number
          mentor_id: string
          notes: string | null
          timestamp: string
        }
        Insert: {
          action: string
          admin_id?: string | null
          id?: number
          mentor_id: string
          notes?: string | null
          timestamp?: string
        }
        Update: {
          action?: string
          admin_id?: string | null
          id?: number
          mentor_id?: string
          notes?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "mentors_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "mentors_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_logs_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_logs_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_logs_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waiting_list: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          reason: string | null
          status: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          reason?: string | null
          status?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          reason?: string | null
          status?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      mentor_suggestions_view: {
        Row: {
          admin_notes: string | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          free_topics: string[] | null
          id: string | null
          inclusion_tags: string[] | null
          knowledge_topics: string[] | null
          last_name: string | null
          linkedin_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_first_name: string | null
          reviewer_last_name: string | null
          status: string | null
          suggestion_text: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      mentors_admin_view: {
        Row: {
          active_roles: string[] | null
          age: number | null
          availability_status: string | null
          avatar_url: string | null
          average_rating: number | null
          bio: string | null
          chat_enabled: boolean | null
          city: string | null
          company: string | null
          country: string | null
          created_at: string | null
          current_company: string | null
          current_position: string | null
          email: string | null
          experience_years: number | null
          expertise_areas: string[] | null
          first_name: string | null
          full_name: string | null
          github_url: string | null
          id: string | null
          inclusion_tags: string[] | null
          inclusive_tags: string[] | null
          is_available: boolean | null
          job_title: string | null
          languages: string[] | null
          last_name: string | null
          linkedin_url: string | null
          location: string | null
          mentor_skills: string[] | null
          mentorship_topics: string[] | null
          organization_ids: string[] | null
          phone: string | null
          profile_status: string | null
          rating: number | null
          reviews: number | null
          session_duration: number | null
          session_price_usd: number | null
          sessions: number | null
          slug: string | null
          state: string | null
          timezone: string | null
          total_reviews: number | null
          total_sessions: number | null
          twitter_url: string | null
          updated_at: string | null
          verified: boolean | null
          verified_at: string | null
          website_url: string | null
        }
        Relationships: []
      }
      mentors_view: {
        Row: {
          active_roles: string[] | null
          age: number | null
          availability_status: string | null
          avatar_url: string | null
          average_rating: number | null
          bio: string | null
          chat_enabled: boolean | null
          city: string | null
          company: string | null
          country: string | null
          created_at: string | null
          current_company: string | null
          current_position: string | null
          email: string | null
          experience_years: number | null
          expertise_areas: string[] | null
          first_name: string | null
          full_name: string | null
          github_url: string | null
          id: string | null
          inclusion_tags: string[] | null
          inclusive_tags: string[] | null
          is_available: boolean | null
          job_title: string | null
          languages: string[] | null
          last_name: string | null
          linkedin_url: string | null
          location: string | null
          mentor_skills: string[] | null
          mentorship_topics: string[] | null
          organization_ids: string[] | null
          phone: string | null
          rating: number | null
          reviews: number | null
          session_duration: number | null
          session_price_usd: number | null
          sessions: number | null
          slug: string | null
          state: string | null
          timezone: string | null
          total_reviews: number | null
          total_sessions: number | null
          twitter_url: string | null
          updated_at: string | null
          verified: boolean | null
          verified_at: string | null
          website_url: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_user_role: {
        Args: { role_name: string; user_id: string }
        Returns: boolean
      }
      check_organization_quota: {
        Args: { org_id: string; quota_type: string }
        Returns: boolean
      }
      expire_organization_memberships: {
        Args: never
        Returns: {
          expired_count: number
          expired_member_ids: string[]
        }[]
      }
      expire_partner_invitations: { Args: never; Returns: undefined }
      expire_pending_invitations: {
        Args: never
        Returns: {
          expired_count: number
          expired_invitation_ids: string[]
        }[]
      }
      expire_user_partner_access: { Args: never; Returns: undefined }
      generate_secure_token: { Args: { length?: number }; Returns: string }
      generate_unique_slug: { Args: { base_name: string }; Returns: string }
      get_expiring_memberships: {
        Args: { days_ahead?: number }
        Returns: {
          days_until_expiration: number
          expires_at: string
          id: string
          organization_id: string
          organization_name: string
          role: string
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      get_mentor_suggestions_stats: {
        Args: never
        Returns: {
          approved_count: number
          avg_response_time_hours: number
          contacted_count: number
          pending_count: number
          rejected_count: number
          reviewing_count: number
          total_suggestions: number
        }[]
      }
      get_mentor_visible_organizations: {
        Args: { p_mentor_id: string }
        Returns: {
          organization_id: string
          organization_name: string
          organization_type: string
        }[]
      }
      get_mentors_by_organization: {
        Args: { p_organization_id: string; p_user_id?: string }
        Returns: {
          mentor_id: string
        }[]
      }
      get_most_active_suggesters: {
        Args: { limit_count?: number }
        Returns: {
          approved_count: number
          email: string
          first_name: string
          last_name: string
          suggestion_count: number
          user_id: string
        }[]
      }
      get_most_suggested_free_topics: {
        Args: { limit_count?: number }
        Returns: {
          suggestion_count: number
          topic: string
        }[]
      }
      get_most_suggested_inclusion_tags: {
        Args: { limit_count?: number }
        Returns: {
          suggestion_count: number
          tag: string
        }[]
      }
      get_most_suggested_knowledge_topics: {
        Args: { limit_count?: number }
        Returns: {
          suggestion_count: number
          topic: string
        }[]
      }
      get_organization_quota_usage: {
        Args: { org_id: string }
        Returns: {
          current_usage: number
          is_unlimited: boolean
          max_limit: number
          percentage_used: number
          quota_type: string
        }[]
      }
      get_user_organization_ids: {
        Args: { user_uuid: string }
        Returns: string[]
      }
      get_user_role: { Args: { user_id: string }; Returns: string }
      get_visible_mentor_ids: {
        Args: { p_user_id: string }
        Returns: {
          mentor_id: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_mentor_visible_to_user: {
        Args: { p_mentor_id: string; p_user_id: string }
        Returns: boolean
      }
      is_organization_admin: {
        Args: { org_id: string; user_id: string }
        Returns: boolean
      }
      mark_old_suggestions_as_expired: {
        Args: { days_old?: number }
        Returns: number
      }
      user_has_partner_access: {
        Args: { p_partner_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      hub_resource_status: "pending" | "published" | "rejected" | "archived"
      hub_resource_type: "event" | "course" | "tool" | "discount" | "job"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      hub_resource_status: ["pending", "published", "rejected", "archived"],
      hub_resource_type: ["event", "course", "tool", "discount", "job"],
    },
  },
} as const
