import { createClient } from "@/utils/supabase/server"

export interface AuditLog {
  id?: string
  admin_user_id: string
  action: string
  target_user_id?: string
  target_user_email?: string
  details: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at?: string
}

export type AuditAction = 
  | "user_created"
  | "user_updated" 
  | "user_deleted"
  | "user_role_changed"
  | "user_status_changed"
  | "password_reset"
  | "email_changed"
  | "bulk_action"

/**
 * Log admin actions for audit trail
 */
export async function logAdminAction(
  adminUserId: string,
  action: AuditAction,
  details: Record<string, any>,
  targetUserId?: string,
  targetUserEmail?: string,
  request?: Request
): Promise<void> {
  try {
    const supabase = await createClient()

    // Extract IP and User Agent from request if available
    let ipAddress: string | undefined
    let userAgent: string | undefined

    if (request) {
      ipAddress = request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown'
      userAgent = request.headers.get('user-agent') || 'unknown'
    }

    const logEntry: AuditLog = {
      admin_user_id: adminUserId,
      action,
      target_user_id: targetUserId,
      target_user_email: targetUserEmail,
      details,
      ip_address: ipAddress,
      user_agent: userAgent
    }

    const { error } = await supabase
      .from("admin_audit_logs")
      .insert(logEntry)

    if (error) {
      console.error("Failed to log admin action:", error)
      // Don't throw error to avoid breaking the main operation
    }
  } catch (error) {
    console.error("Error in audit logging:", error)
    // Don't throw error to avoid breaking the main operation
  }
}

/**
 * Get audit logs with pagination and filtering
 */
export async function getAuditLogs(
  page: number = 1,
  limit: number = 50,
  adminUserId?: string,
  action?: string,
  targetUserId?: string
) {
  try {
    const supabase = await createClient()
    const offset = (page - 1) * limit

    let query = supabase
      .from("admin_audit_logs")
      .select(`
        *,
        admin:profiles!admin_audit_logs_admin_user_id_fkey(full_name, email),
        target:profiles!admin_audit_logs_target_user_id_fkey(full_name, email)
      `)
      .order("created_at", { ascending: false })

    // Apply filters
    if (adminUserId) {
      query = query.eq("admin_user_id", adminUserId)
    }
    
    if (action) {
      query = query.eq("action", action)
    }
    
    if (targetUserId) {
      query = query.eq("target_user_id", targetUserId)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: logs, error } = await query

    if (error) {
      throw error
    }

    // Get total count
    let countQuery = supabase
      .from("admin_audit_logs")
      .select("*", { count: "exact", head: true })

    if (adminUserId) {
      countQuery = countQuery.eq("admin_user_id", adminUserId)
    }
    
    if (action) {
      countQuery = countQuery.eq("action", action)
    }
    
    if (targetUserId) {
      countQuery = countQuery.eq("target_user_id", targetUserId)
    }

    const { count } = await countQuery

    return {
      logs: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    throw error
  }
}

/**
 * Create audit logs table migration
 */
export const AUDIT_LOGS_MIGRATION = `
-- Create admin_audit_logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_email TEXT,
  details JSONB NOT NULL DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_user ON admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user ON admin_audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON admin_audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON admin_audit_logs
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.user_role = 'admin'
    )
  );

-- Only system can insert audit logs (no direct user access)
CREATE POLICY "System can insert audit logs" ON admin_audit_logs
  FOR INSERT 
  WITH CHECK (true); -- This will be controlled by service role
`