import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default supabase;


// TYPES
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      mentors: {
        Row: {
          academy: string | null
          bio: string | null
          calendar: string | null
          city: string | null
          country: string | null
          created: string
          email: string | null
          id: string
          job: string | null
          language: string | null
          linkedin: string | null
          name: string | null
          photo: string | null
          skills: string[] | null
          social: Json[] | null
          state: string | null
          subject: Json[] | null
          tools: string[] | null
        }
        Insert: {
          academy?: string | null
          bio?: string | null
          calendar?: string | null
          city?: string | null
          country?: string | null
          created?: string
          email?: string | null
          id?: string
          job?: string | null
          language?: string | null
          linkedin?: string | null
          name?: string | null
          photo?: string | null
          skills?: string[] | null
          social?: Json[] | null
          state?: string | null
          subject?: Json[] | null
          tools?: string[] | null
        }
        Update: {
          academy?: string | null
          bio?: string | null
          calendar?: string | null
          city?: string | null
          country?: string | null
          created?: string
          email?: string | null
          id?: string
          job?: string | null
          language?: string | null
          linkedin?: string | null
          name?: string | null
          photo?: string | null
          skills?: string[] | null
          social?: Json[] | null
          state?: string | null
          subject?: Json[] | null
          tools?: string[] | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
