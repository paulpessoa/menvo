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
      ai_budget: {
        Row: {
          limit_usd: number
          month: string
          updated_at: string
        }
        Insert: {
          limit_usd: number
          month: string
          updated_at?: string
        }
        Update: {
          limit_usd?: number
          month?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_entitlements: {
        Row: {
          feature: string
          monthly_limit: number | null
          role: string
          updated_at: string
        }
        Insert: {
          feature: string
          monthly_limit?: number | null
          role: string
          updated_at?: string
        }
        Update: {
          feature?: string
          monthly_limit?: number | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_missing_demands: {
        Row: {
          created_at: string | null
          id: string
          matched_count: number | null
          query_text: string
          suggested_topics: string[] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          matched_count?: number | null
          query_text: string
          suggested_topics?: string[] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          matched_count?: number | null
          query_text?: string
          suggested_topics?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_model_config: {
        Row: {
          active: boolean
          capability: string
          fallback: Json
          model: string
          notes: string | null
          params: Json
          provider: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          capability: string
          fallback?: Json
          model: string
          notes?: string | null
          params?: Json
          provider: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          capability?: string
          fallback?: Json
          model?: string
          notes?: string | null
          params?: Json
          provider?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_model_pricing: {
        Row: {
          cached_input_per_mtok: number | null
          effective_from: string
          input_per_mtok: number
          model: string
          notes: string | null
          output_per_mtok: number
          provider: string
        }
        Insert: {
          cached_input_per_mtok?: number | null
          effective_from?: string
          input_per_mtok: number
          model: string
          notes?: string | null
          output_per_mtok: number
          provider: string
        }
        Update: {
          cached_input_per_mtok?: number | null
          effective_from?: string
          input_per_mtok?: number
          model?: string
          notes?: string | null
          output_per_mtok?: number
          provider?: string
        }
        Relationships: []
      }
      ai_quota_ledger: {
        Row: {
          feature: string
          period_start: string
          updated_at: string
          used_count: number
          user_id: string
        }
        Insert: {
          feature: string
          period_start: string
          updated_at?: string
          used_count?: number
          user_id: string
        }
        Update: {
          feature?: string
          period_start?: string
          updated_at?: string
          used_count?: number
          user_id?: string
        }
        Relationships: []
      }
      ai_usage_events: {
        Row: {
          cached_input_tokens: number
          cost_usd: number | null
          created_at: string
          error_code: string | null
          feature: string
          id: string
          input_tokens: number
          latency_ms: number | null
          model: string
          output_tokens: number
          provider: string
          roles: string[]
          run_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          cached_input_tokens?: number
          cost_usd?: number | null
          created_at?: string
          error_code?: string | null
          feature: string
          id?: string
          input_tokens?: number
          latency_ms?: number | null
          model: string
          output_tokens?: number
          provider: string
          roles?: string[]
          run_id?: string | null
          status: string
          user_id?: string | null
        }
        Update: {
          cached_input_tokens?: number
          cost_usd?: number | null
          created_at?: string
          error_code?: string | null
          feature?: string
          id?: string
          input_tokens?: number
          latency_ms?: number | null
          model?: string
          output_tokens?: number
          provider?: string
          roles?: string[]
          run_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      appointment_feedbacks: {
        Row: {
          admin_notes: string | null
          appointment_id: string
          created_at: string
          id: string
          private_notes: string | null
          public_feedback: string | null
          rating: number | null
          rejection_reason: string | null
          reviewed_id: string
          reviewer_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          appointment_id: string
          created_at?: string
          id?: string
          private_notes?: string | null
          public_feedback?: string | null
          rating?: number | null
          rejection_reason?: string | null
          reviewed_id: string
          reviewer_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          appointment_id?: string
          created_at?: string
          id?: string
          private_notes?: string | null
          public_feedback?: string | null
          rating?: number | null
          rejection_reason?: string | null
          reviewed_id?: string
          reviewer_id?: string
          status?: string | null
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
          feedback_requested_at: string | null
          google_calendar_link: string | null
          google_event_id: string | null
          google_meet_link: string | null
          id: string
          meeting_link: string | null
          meeting_url: string | null
          mentee_id: string
          mentor_id: string
          mentor_response: string | null
          message: string | null
          notes_mentee: string | null
          notes_mentor: string | null
          organization_id: string | null
          reminded_at: string | null
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
          feedback_requested_at?: string | null
          google_calendar_link?: string | null
          google_event_id?: string | null
          google_meet_link?: string | null
          id?: string
          meeting_link?: string | null
          meeting_url?: string | null
          mentee_id: string
          mentor_id: string
          mentor_response?: string | null
          message?: string | null
          notes_mentee?: string | null
          notes_mentor?: string | null
          organization_id?: string | null
          reminded_at?: string | null
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
          feedback_requested_at?: string | null
          google_calendar_link?: string | null
          google_event_id?: string | null
          google_meet_link?: string | null
          id?: string
          meeting_link?: string | null
          meeting_url?: string | null
          mentee_id?: string
          mentor_id?: string
          mentor_response?: string | null
          message?: string | null
          notes_mentee?: string | null
          notes_mentor?: string | null
          organization_id?: string | null
          reminded_at?: string | null
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
        ]
      }
      assistant_conversations: {
        Row: {
          ai_response: string
          created_at: string
          id: string
          user_id: string
          user_message: string
        }
        Insert: {
          ai_response: string
          created_at?: string
          id?: string
          user_id: string
          user_message: string
        }
        Update: {
          ai_response?: string
          created_at?: string
          id?: string
          user_id?: string
          user_message?: string
        }
        Relationships: []
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
      feature_flag_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          flag_name: string
          id: number
          performed_by: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          flag_name: string
          id?: number
          performed_by?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          flag_name?: string
          id?: number
          performed_by?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean | null
          id: number
          name: string
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          enabled?: boolean | null
          id?: number
          name: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          enabled?: boolean | null
          id?: number
          name?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
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
      google_calendar_tokens: {
        Row: {
          access_token: string
          expiry_date: number
          refresh_token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          expiry_date: number
          refresh_token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          expiry_date?: number
          refresh_token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mentor_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          mentor_id: string
          start_time: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          mentor_id: string
          start_time: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
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
          context: Json | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          status: string
          topic: string
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          status?: string
          topic: string
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          status?: string
          topic?: string
          user_id?: string | null
        }
        Relationships: []
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
          consent_date: string | null
          consent_given: boolean
          created_at: string
          email: string
          id: string
          ip_address: string | null
          marketing_consent: boolean
          name: string | null
          status: string | null
          unsubscribed_at: string | null
          user_agent: string | null
          whatsapp: string | null
        }
        Insert: {
          consent_date?: string | null
          consent_given?: boolean
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          marketing_consent?: boolean
          name?: string | null
          status?: string | null
          unsubscribed_at?: string | null
          user_agent?: string | null
          whatsapp?: string | null
        }
        Update: {
          consent_date?: string | null
          consent_given?: boolean
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          marketing_consent?: boolean
          name?: string | null
          status?: string | null
          unsubscribed_at?: string | null
          user_agent?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          organization_id: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          role: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
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
          contact_email: string | null
          contact_name: string | null
          created_at: string
          id: string
          join_policy: string
          name: string
          slug: string
          status: string
          type: string
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          join_policy?: string
          name: string
          slug: string
          status?: string
          type: string
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          join_policy?: string
          name?: string
          slug?: string
          status?: string
          type?: string
        }
        Relationships: []
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
          is_pending_mentor: boolean | null
          is_public: boolean | null
          is_volunteer: boolean | null
          job_title: string | null
          languages: string[] | null
          last_name: string | null
          learning_goals: string | null
          linkedin_url: string | null
          location: string | null
          mentee_status: string | null
          mentorship_approach: string | null
          mentorship_guidelines: string | null
          mentorship_topics: string[] | null
          origin_platform: string | null
          original_data: Json | null
          phone: string | null
          portfolio_url: string | null
          profile_visibility: string | null
          search_vector: unknown
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
          is_pending_mentor?: boolean | null
          is_public?: boolean | null
          is_volunteer?: boolean | null
          job_title?: string | null
          languages?: string[] | null
          last_name?: string | null
          learning_goals?: string | null
          linkedin_url?: string | null
          location?: string | null
          mentee_status?: string | null
          mentorship_approach?: string | null
          mentorship_guidelines?: string | null
          mentorship_topics?: string[] | null
          origin_platform?: string | null
          original_data?: Json | null
          phone?: string | null
          portfolio_url?: string | null
          profile_visibility?: string | null
          search_vector?: unknown
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
          is_pending_mentor?: boolean | null
          is_public?: boolean | null
          is_volunteer?: boolean | null
          job_title?: string | null
          languages?: string[] | null
          last_name?: string | null
          learning_goals?: string | null
          linkedin_url?: string | null
          location?: string | null
          mentee_status?: string | null
          mentorship_approach?: string | null
          mentorship_guidelines?: string | null
          mentorship_topics?: string[] | null
          origin_platform?: string | null
          original_data?: Json | null
          phone?: string | null
          portfolio_url?: string | null
          profile_visibility?: string | null
          search_vector?: unknown
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
        Relationships: []
      }
      quiz_responses: {
        Row: {
          ai_analysis: Json | null
          analysis_claimed_at: string | null
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
          analysis_claimed_at?: string | null
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
          analysis_claimed_at?: string | null
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
          id: string
          role_id: number
          user_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          role_id: number
          user_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          role_id?: number
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
      validation_requests: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          id: string
          request_type: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          request_type: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          request_type?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      ai_usage_by_user_monthly: {
        Row: {
          calls: number | null
          cost_usd: number | null
          full_name: string | null
          month: string | null
          user_id: string | null
        }
        Relationships: []
      }
      ai_usage_monthly: {
        Row: {
          calls: number | null
          cost_usd: number | null
          errors: number | null
          fallbacks: number | null
          feature: string | null
          input_tokens: number | null
          model: string | null
          month: string | null
          output_tokens: number | null
          p50_latency_ms: number | null
          provider: string | null
          unpriced_calls: number | null
          users: number | null
        }
        Relationships: []
      }
      mentors_view: {
        Row: {
          academic_level: string | null
          address: string | null
          availability: Json | null
          availability_status: string | null
          avatar_url: string | null
          average_rating: number | null
          bio: string | null
          chat_enabled: boolean | null
          city: string | null
          company: string | null
          country: string | null
          course: string | null
          created_at: string | null
          cv_url: string | null
          email: string | null
          expected_graduation: string | null
          experience_years: number | null
          expertise_areas: string[] | null
          external_id: string | null
          first_name: string | null
          free_topics: string[] | null
          full_name: string | null
          github_url: string | null
          id: string | null
          ideal_mentee: string | null
          inclusive_tags: string[] | null
          institution: string | null
          is_pending_mentor: boolean | null
          is_public: boolean | null
          is_volunteer: boolean | null
          job_title: string | null
          languages: string[] | null
          last_name: string | null
          linkedin_url: string | null
          location: string | null
          mentor_skills: string[] | null
          mentorship_approach: string | null
          mentorship_guidelines: string | null
          mentorship_topics: string[] | null
          origin_platform: string | null
          phone: string | null
          portfolio_url: string | null
          show_in_community: boolean | null
          slug: string | null
          state: string | null
          timezone: string | null
          total_reviews: number | null
          total_sessions: number | null
          twitter_url: string | null
          updated_at: string | null
          verification_status: string | null
          verified: boolean | null
          website_url: string | null
          what_to_expect: string | null
        }
        Insert: {
          academic_level?: string | null
          address?: string | null
          availability?: never
          availability_status?: string | null
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          chat_enabled?: boolean | null
          city?: string | null
          company?: string | null
          country?: string | null
          course?: string | null
          created_at?: string | null
          cv_url?: string | null
          email?: string | null
          expected_graduation?: string | null
          experience_years?: number | null
          expertise_areas?: string[] | null
          external_id?: string | null
          first_name?: string | null
          free_topics?: string[] | null
          full_name?: string | null
          github_url?: string | null
          id?: string | null
          ideal_mentee?: string | null
          inclusive_tags?: string[] | null
          institution?: string | null
          is_pending_mentor?: boolean | null
          is_public?: boolean | null
          is_volunteer?: boolean | null
          job_title?: string | null
          languages?: string[] | null
          last_name?: string | null
          linkedin_url?: string | null
          location?: never
          mentor_skills?: never
          mentorship_approach?: string | null
          mentorship_guidelines?: string | null
          mentorship_topics?: string[] | null
          origin_platform?: string | null
          phone?: string | null
          portfolio_url?: string | null
          show_in_community?: boolean | null
          slug?: string | null
          state?: string | null
          timezone?: string | null
          total_reviews?: number | null
          total_sessions?: number | null
          twitter_url?: string | null
          updated_at?: string | null
          verification_status?: string | null
          verified?: boolean | null
          website_url?: string | null
          what_to_expect?: string | null
        }
        Update: {
          academic_level?: string | null
          address?: string | null
          availability?: never
          availability_status?: string | null
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          chat_enabled?: boolean | null
          city?: string | null
          company?: string | null
          country?: string | null
          course?: string | null
          created_at?: string | null
          cv_url?: string | null
          email?: string | null
          expected_graduation?: string | null
          experience_years?: number | null
          expertise_areas?: string[] | null
          external_id?: string | null
          first_name?: string | null
          free_topics?: string[] | null
          full_name?: string | null
          github_url?: string | null
          id?: string | null
          ideal_mentee?: string | null
          inclusive_tags?: string[] | null
          institution?: string | null
          is_pending_mentor?: boolean | null
          is_public?: boolean | null
          is_volunteer?: boolean | null
          job_title?: string | null
          languages?: string[] | null
          last_name?: string | null
          linkedin_url?: string | null
          location?: never
          mentor_skills?: never
          mentorship_approach?: string | null
          mentorship_guidelines?: string | null
          mentorship_topics?: string[] | null
          origin_platform?: string | null
          phone?: string | null
          portfolio_url?: string | null
          show_in_community?: boolean | null
          slug?: string | null
          state?: string | null
          timezone?: string | null
          total_reviews?: number | null
          total_sessions?: number | null
          twitter_url?: string | null
          updated_at?: string | null
          verification_status?: string | null
          verified?: boolean | null
          website_url?: string | null
          what_to_expect?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      ai_budget_exhausted: { Args: never; Returns: boolean }
      ai_current_period: { Args: never; Returns: string }
      ai_monthly_limit: {
        Args: { p_feature: string; p_user_id: string }
        Returns: {
          monthly_limit: number
          unlimited: boolean
        }[]
      }
      ai_user_roles: { Args: { p_user_id: string }; Returns: string[] }
      assign_user_role: {
        Args: { role_name: string; user_id: string }
        Returns: boolean
      }
      check_user_role: { Args: { target_role: string }; Returns: boolean }
      claim_quiz_analysis: {
        Args: { p_id: string; p_server_key: string }
        Returns: {
          career_moment: string | null
          claimed: boolean
          current_challenge: string | null
          development_areas: string[] | null
          future_vision: string | null
          mentorship_experience: string | null
          name: string | null
          personal_life_help: string | null
          share_knowledge: string | null
        }[]
      }
      consume_ai_quota: {
        Args: { p_feature: string }
        Returns: {
          allowed: boolean
          quota_limit: number
          reason: string
          resets_at: string
          used: number
        }[]
      }
      generate_secure_token: { Args: { length?: number }; Returns: string }
      generate_unique_slug: { Args: { base_name: string }; Returns: string }
      get_ai_quota: {
        Args: { p_feature: string }
        Returns: {
          allowed: boolean
          quota_limit: number
          reason: string
          resets_at: string
          used: number
        }[]
      }
      get_google_calendar_tokens: {
        Args: { p_user_id: string }
        Returns: {
          access_token: string
          expiry_date: number
          refresh_token: string
          updated_at: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "google_calendar_tokens"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_quiz_result: {
        Args: { p_id: string }
        Returns: { ai_analysis: Json | null; id: string; processed_at: string | null }[]
      }
      get_user_role: { Args: { user_id: string }; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_org_admin: { Args: { p_organization_id: string }; Returns: boolean }
      org_members_quiz_done: {
        Args: { p_org: string }
        Returns: { email: string }[]
      }
      record_ai_usage: {
        Args: {
          p_cached_input_tokens?: number
          p_error_code?: string
          p_feature: string
          p_input_tokens?: number
          p_latency_ms?: number
          p_model: string
          p_output_tokens?: number
          p_provider: string
          p_run_id?: string
          p_server_key: string
          p_status?: string
        }
        Returns: string
      }
      save_google_calendar_tokens: {
        Args: {
          p_access_token: string
          p_expires_in: number
          p_refresh_token: string
          p_scope?: string
          p_user_id: string
        }
        Returns: undefined
      }
      save_quiz_analysis: {
        Args: { p_analysis: Json; p_id: string; p_score?: number | null; p_server_key: string }
        Returns: undefined
      }
      sync_waiting_list_status: { Args: never; Returns: undefined }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
