/**
 * User and Profile Types
 * Simplified from Database generated types for better DevEx
 */

export type UserRole = "mentor" | "mentee" | "admin" | "volunteer" | "moderator"

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  bio: string | null
  slug: string | null
  verified: boolean
  verification_status: "pending" | "approved" | "rejected" | null

  // Professional info
  job_title: string | null
  job_title?: string | null // Alias for job_title
  company: string | null
  experience_years: number | null
  expertise_areas: string[] | null
  languages: string[] | null
  cv_url?: string | null

  // Mentorship specifics
  mentorship_topics: string[] | null
  inclusive_tags: string[] | null
  inclusion_tags?: string[] | null // Alias for inclusive_tags
  availability_status: string | null
  average_rating: number | null
  total_reviews: number | null
  total_sessions: number | null
  is_pending_mentor?: boolean
  learning_goals?: string | null

  // Social/Links
  linkedin_url: string | null
  github_url: string | null
  website_url: string | null
  portfolio_url?: string | null

  // System
  created_at: string
  updated_at: string
  roles: UserRole[]
  is_public: boolean
  timezone?: string | null
}

/**
 * Metadata stored in Supabase Auth user
 */
export interface UserMetadata {
  first_name?: string
  last_name?: string
  full_name?: string
  avatar_url?: string
  user_type?: UserRole
}
