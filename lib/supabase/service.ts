import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Create a single Supabase client for interacting with your database
// This client uses the service role key and should ONLY be used on the server
export const createServiceRoleClient = () =>
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
