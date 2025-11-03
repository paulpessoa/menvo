// =================================================================
// ORGANIZATION TYPES - Multi-Tenant System
// TypeScript types for organizations, members, visibility, and activity
// =================================================================

export type OrganizationType =
  | "company"
  | "ngo"
  | "hackathon"
  | "sebrae"
  | "community"
  | "other"
export type OrganizationStatus =
  | "pending_approval"
  | "active"
  | "suspended"
  | "inactive"
export type MemberRole = "admin" | "mentor" | "mentee"
export type MemberStatus =
  | "invited"
  | "active"
  | "declined"
  | "left"
  | "expired"
  | "cancelled"
export type VisibilityScope = "public" | "exclusive"
export type ActivityType =
  | "member_joined"
  | "member_left"
  | "member_invited"
  | "appointment_created"
  | "appointment_completed"
  | "appointment_cancelled"
  | "organization_created"
  | "organization_approved"
  | "settings_updated"

export interface Organization {
  id: string
  name: string
  slug: string
  type: OrganizationType
  description?: string
  logo_url?: string
  website?: string
  contact_email: string
  contact_phone?: string
  status: OrganizationStatus
  max_mentors?: number
  max_mentees?: number
  max_monthly_appointments?: number
  approved_by?: string
  approved_at?: string
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: MemberRole
  status: MemberStatus
  invitation_token?: string
  invited_by?: string
  invited_at: string
  activated_at?: string
  expires_at?: string
  left_at?: string
  created_at: string
  updated_at: string
}

export interface OrganizationMemberWithProfile extends OrganizationMember {
  user: {
    id: string
    email: string
    first_name?: string
    last_name?: string
    full_name?: string
    avatar_url?: string
  }
}

export interface OrganizationMemberWithOrganization extends OrganizationMember {
  organization: {
    id: string
    name: string
    slug: string
    type: OrganizationType
    logo_url?: string
  }
}

export interface MentorVisibilitySettings {
  id: string
  mentor_id: string
  visibility_scope: VisibilityScope
  visible_to_organizations: string[]
  created_at: string
  updated_at: string
}

export interface OrganizationActivityLog {
  id: string
  organization_id: string
  activity_type: ActivityType
  actor_id?: string
  target_id?: string
  metadata?: Record<string, any>
  created_at: string
}

export interface OrganizationActivityLogWithProfiles
  extends OrganizationActivityLog {
  actor?: {
    id: string
    full_name?: string
    avatar_url?: string
  }
  target?: {
    id: string
    full_name?: string
    avatar_url?: string
  }
}

export interface OrganizationStats {
  total_mentors: number
  total_mentees: number
  total_appointments_month: number
  total_appointments_completed: number
  completion_rate: number
  top_topics: Array<{ topic: string; count: number }>
  active_mentors: number
}

export interface QuotaUsage {
  quota_type: "mentors" | "mentees" | "monthly_appointments"
  current_usage: number
  max_limit?: number
  is_unlimited: boolean
  percentage_used: number
}

export interface InvitationRequest {
  email: string
  role: MemberRole
  expires_at?: string
}

export interface BulkInvitationRequest {
  invitations: InvitationRequest[]
}

export interface BulkInvitationResult {
  success_count: number
  failed_count: number
  errors: Array<{
    email: string
    error: string
  }>
}

export interface CreateOrganizationRequest {
  name: string
  type: OrganizationType
  description?: string
  logo_url?: string
  website?: string
  contact_email: string
  contact_phone?: string
}

export interface UpdateOrganizationRequest {
  name?: string
  description?: string
  logo_url?: string
  website?: string
  contact_email?: string
  contact_phone?: string
}

export interface UpdateVisibilityRequest {
  visibility_scope: VisibilityScope
  visible_to_organizations?: string[]
}
