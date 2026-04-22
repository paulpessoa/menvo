/**
 * Community Event Types
 */

export type EventType = 'workshop' | 'webinar' | 'meetup' | 'conference' | 'hackathon' | 'other';
export type EventFormat = 'in-person' | 'virtual' | 'hybrid';
export type EventSource = 'internal' | 'external';

export interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  start_date: string;
  start_time: string | null;
  time: string | null;
  location: string | null;
  format: EventFormat;
  type: EventType;
  source: EventSource;
  coordinates?: { lat: number; lng: number } | null;
  image_url: string | null;
  url: string | null;
  organizer_id: string | null;
  is_verified: boolean;
  is_free: boolean;
  price?: number | null;
  current_attendees: number;
  max_attendees?: number | null;
  tags: string[] | null;
  created_at: string;
  updated_at?: string;
}

export interface EventFilters {
  search: string;
  types: EventType[];
  formats: EventFormat[];
  sources: EventSource[];
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  tags: string[];
}
