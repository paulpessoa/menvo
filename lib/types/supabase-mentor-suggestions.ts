// Tipos específicos para a tabela mentor_suggestions
// Este arquivo ajuda a resolver problemas de tipagem com o Supabase

export interface MentorSuggestionInsert {
  user_id: string
  suggestion_text: string
  knowledge_topics?: string[]
  free_topics?: string[]
  inclusion_tags?: string[]
  status?: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'contacted'
}

export interface MentorSuggestionUpdate {
  suggestion_text?: string
  linkedin_url?: string
  knowledge_topics?: string[]
  free_topics?: string[]
  inclusion_tags?: string[]
  status?: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'contacted'
  admin_notes?: string
  reviewed_at?: string
  reviewed_by?: string
}

export interface MentorSuggestionRow {
  id: string
  user_id: string
  suggestion_text: string
  linkedin_url: string | null
  knowledge_topics: string[] | null
  free_topics: string[] | null
  inclusion_tags: string[] | null
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'contacted'
  admin_notes: string | null
  created_at: string
  updated_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}
