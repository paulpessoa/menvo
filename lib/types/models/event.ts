/**
 * Community Event Types
 */

export interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  start_date: string; // Adicionado para compatibilidade
  start_time: string | null; // Adicionado
  time: string | null;
  location: string | null;
  format: 'in-person' | 'virtual' | 'hybrid'; // Adicionado
  type: string; // Adicionado
  coordinates?: { lat: number; lng: number } | null; // Adicionado
  image_url: string | null;
  url: string | null;
  organizer_id: string | null;
  is_verified: boolean;
  is_free: boolean; // Adicionado
  price?: number | null; // Adicionado
  current_attendees: number; // Adicionado
  max_attendees?: number | null; // Adicionado
  tags: string[] | null;
  created_at: string;
  updated_at?: string;
}
