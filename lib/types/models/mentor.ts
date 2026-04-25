import { UserProfile } from "./user"

/**
 * Mentor Profile from mentors_view
 */
export interface MentorProfile extends Partial<UserProfile> {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  bio: string | null
  job_title: string | null
  job_title: string | null // Added for compatibility
  company: string | null
  location: string | null
  availability_status: "available" | "busy"
  experience_years: number | null
  mentor_skills: string[] | null
  languages: string[] | null
  academic_level: string | null
  inclusion_tags: string[] | null
  inclusive_tags: string[] | null // Added for compatibility
  average_rating?: number
  total_sessions?: number
  total_reviews?: number
}

export interface MentorFilters {
  search?: string
  topics?: string[]
  languages?: string[]
  inclusionTags?: string[]
  experienceYears?: number[]
  educationLevels?: string[]
  city?: string
  country?: string
  availability_status?: string
  page?: number
  limit?: number
}

export interface PaginatedMentors {
  mentors: MentorProfile[]
  totalCount: number
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}
