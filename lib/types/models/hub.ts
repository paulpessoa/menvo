/**
 * Hub and Community Types
 */

export type HubResourceType = 'event' | 'course' | 'tool' | 'discount' | 'job';
export type HubResourceStatus = 'pending' | 'published' | 'rejected' | 'archived';

export interface HubResource {
  id: string;
  title: string;
  description: string | null;
  type: HubResourceType;
  url: string;
  image_url: string | null;
  status: HubResourceStatus;
  badge_text: string | null;
  is_affiliate: boolean;
  address: string | null;
  location_url: string | null;
  event_date: string | null;
  event_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface MentorSuggestion {
  id: string;
  name: string;
  linkedin_url: string | null;
  reason: string | null;
  suggested_by: string | null; // Profile ID
  status: 'pending' | 'reviewing' | 'contacted' | 'approved' | 'rejected';
  created_at: string;
}
