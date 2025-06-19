export type EventType =
  | "course"
  | "workshop"
  | "hackathon"
  | "lecture"
  | "seminar"
  | "webinar"
  | "conference"
  | "networking"
export type EventFormat = "virtual" | "in-person" | "hybrid"
export type EventSource = "internal" | "external"
export type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled"

export interface Event {
  id: string
  title: string
  description: string
  type: EventType
  format: EventFormat
  source: EventSource
  status: EventStatus
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  timezone: string
  location?: string
  virtual_link?: string
  image_url?: string
  organizer: string
  organizer_avatar?: string
  price: number
  currency: string
  is_free: boolean
  max_attendees?: number
  current_attendees: number
  tags: string[]
  requirements?: string[]
  what_you_learn?: string[]
  agenda?: {
    time: string
    title: string
    description?: string
  }[]
  speakers?: {
    name: string
    title: string
    company?: string
    avatar?: string
    bio?: string
  }[]
  coordinates?: {
    lat: number
    lng: number
  }
  created_at: string
  updated_at: string
}

export interface EventFilters {
  search: string
  types: EventType[]
  formats: EventFormat[]
  sources: EventSource[]
  priceRange: [number, number]
  isFree?: boolean
  dateRange: {
    start?: string
    end?: string
  }
  tags: string[]
}
