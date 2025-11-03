// =================================================================
// SERVICE ROLE SUPABASE CLIENT - Multi-Tenant System
// Supabase client with service role key for privileged operations
// NEVER expose this client to the browser/client-side code
// =================================================================

import { createClient } from "@supabase/supabase-js"

/**
 * Creates a Supabase client with service role privileges
 *
 * WARNING: This client bypasses Row Level Security (RLS) policies.
 * Only use in server-side code (API routes, server components).
 * Never expose service role key to client-side code.
 *
 * Use cases:
 * - Bulk invitations (creating users that don't exist yet)
 * - Admin operations (approving organizations)
 * - System operations (expiring memberships, activity logs)
 * - Operations requiring cross-user data access
 *
 * @returns Supabase client with service role privileges
 * @throws Error if SUPABASE_SERVICE_ROLE_KEY is not defined
 */
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not defined in environment variables"
    )
  }

  if (!supabaseServiceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables"
    )
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Type guard to ensure we're running on the server
 * Prevents accidental use of service role client on client-side
 */
export function ensureServerSide() {
  if (typeof window !== "undefined") {
    throw new Error("Service role client can only be used on the server side")
  }
}
