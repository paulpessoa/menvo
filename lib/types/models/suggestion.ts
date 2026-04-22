/**
 * Mentor Suggestion Types
 */

export type SuggestionStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'contacted';

export interface MentorSuggestion {
  id: string;
  user_id: string;
  suggestion_text: string;
  linkedin_url?: string | null;
  knowledge_topics?: string[] | null;
  free_topics?: string[] | null;
  inclusion_tags?: string[] | null;
  status: SuggestionStatus;
  admin_notes?: string | null;
  created_at: string;
  updated_at?: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
}

export interface MentorSuggestionWithUser extends MentorSuggestion {
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string;
  reviewer_first_name?: string;
  reviewer_last_name?: string;
}
