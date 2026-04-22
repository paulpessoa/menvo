/**
 * Community Event Types
 */

export type EventType = 'workshop' | 'webinar' | 'meetup' | 'conference' | 'hackathon' | 'course' | 'lecture' | 'seminar' | 'networking' | 'other';
export type EventFormat = 'in-person' | 'virtual' | 'hybrid';
export type EventSource = 'internal' | 'external';

export interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  start_date: string;
  end_date?: string; // Adicionado para multi-day
  start_time: string | null;
  end_time?: string | null; // Adicionado
  time: string | null;
  location: string | null;
  format: EventFormat;
  type: EventType;
  source: EventSource;
  coordinates?: { lat: number; lng: number } | null;
  image_url: string | null;
  url: string | null;
  organizer_id: string | null;
  organizer?: string; // Adicionado para compatibilidade UI
  organizer_avatar?: string; // Adicionado para compatibilidade UI
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
  isFree?: boolean;
  priceRange: [number, number];
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
    start?: string;
    end?: string;
  };
  tags: string[];
}
