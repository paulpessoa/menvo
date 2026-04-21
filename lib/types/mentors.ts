export interface Mentor {
  id: string
  name: string
  title: string
  company: string
  bio: string
  topics: string[]
  languages: string[]
  rating: number
  reviews: number
  sessions: number
  location: string
  coordinates?: {
    lat: number
    lng: number
  }
  avatar_url?: string
  expertise_areas: string[]
  inclusion_tags: string[]
  experience_years: number
  timezone: string
  is_available: boolean
  session_duration: number
  created_at: string
}

export interface MentorFilters {
  search: string
  topics: string[]
  languages: string[]
  locations: string[]
  experience_levels: string[]
  inclusion_tags: string[]
  rating_min: number
  availability: boolean
}
