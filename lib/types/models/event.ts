/**
 * Community Event Types
 */

export interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  location: string | null;
  image_url: string | null;
  url: string | null;
  organizer_id: string | null;
  is_verified: boolean;
  tags: string[] | null;
  created_at: string;
  updated_at?: string;
}
