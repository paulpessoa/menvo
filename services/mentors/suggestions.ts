import { createClient } from '@/utils/supabase/client'
import type {
  MentorSuggestionInsert,
  MentorSuggestionUpdate,
  MentorSuggestionRow
} from '@/types/supabase-mentor-suggestions'

export interface MentorSuggestion {
  id?: string
  user_id: string
  suggestion_text: string
  linkedin_url?: string
  knowledge_topics?: string[]
  free_topics?: string[]
  inclusion_tags?: string[]
  status?: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'contacted'
  admin_notes?: string
  created_at?: string
  updated_at?: string
  reviewed_at?: string
  reviewed_by?: string
}

export interface MentorSuggestionWithUser extends MentorSuggestion {
  first_name?: string
  last_name?: string
  email?: string
  avatar_url?: string
  reviewer_first_name?: string
  reviewer_last_name?: string
}

class MentorSuggestionService {
  async createSuggestion(suggestion: MentorSuggestion): Promise<MentorSuggestion> {
    const supabase = createClient()
    
    const insertData: MentorSuggestionInsert = {
      user_id: suggestion.user_id,
      suggestion_text: suggestion.suggestion_text,
      knowledge_topics: suggestion.knowledge_topics || [],
      free_topics: suggestion.free_topics || [],
      inclusion_tags: suggestion.inclusion_tags || [],
      status: 'pending'
    }

    const { data, error } = await supabase
      .from('mentor_suggestions')
      .insert(insertData as any)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar sugestão: ${error.message}`)
    }

    return data as MentorSuggestion
  }

  async getUserSuggestions(userId: string): Promise<MentorSuggestionWithUser[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('mentor_suggestions_view')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Erro ao buscar sugestões: ${error.message}`)
    }

    return data || []
  }

  async getSuggestionById(id: string): Promise<MentorSuggestionWithUser | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('mentor_suggestions_view')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Erro ao buscar sugestão: ${error.message}`)
    }

    return data
  }

  async updateSuggestion(
    id: string,
    updates: Partial<MentorSuggestion>
  ): Promise<MentorSuggestion> {
    const supabase = createClient()
    
    const updateData: MentorSuggestionUpdate = {
      suggestion_text: updates.suggestion_text,
      linkedin_url: updates.linkedin_url,
      knowledge_topics: updates.knowledge_topics,
      free_topics: updates.free_topics,
      inclusion_tags: updates.inclusion_tags,
      status: updates.status,
      admin_notes: updates.admin_notes,
      reviewed_at: updates.reviewed_at,
      reviewed_by: updates.reviewed_by
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof MentorSuggestionUpdate] === undefined) {
        delete updateData[key as keyof MentorSuggestionUpdate]
      }
    })

    const { data, error} = await supabase
      .from('mentor_suggestions')
      .update(updateData as any)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar sugestão: ${error.message}`)
    }

    return data as MentorSuggestion
  }

  async deleteSuggestion(id: string): Promise<void> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('mentor_suggestions')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao deletar sugestão: ${error.message}`)
    }
  }

  // Admin functions
  async getAllSuggestions(
    status?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<MentorSuggestionWithUser[]> {
    const supabase = createClient()
    
    let query = supabase
      .from('mentor_suggestions_view')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Erro ao buscar sugestões: ${error.message}`)
    }

    return data || []
  }

  async updateSuggestionStatus(
    id: string,
    status: MentorSuggestion['status'],
    adminNotes?: string,
    reviewedBy?: string
  ): Promise<MentorSuggestion> {
    const updates: Partial<MentorSuggestion> = {
      status,
      admin_notes: adminNotes,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewedBy
    }

    return this.updateSuggestion(id, updates)
  }
}

export const mentorSuggestionService = new MentorSuggestionService()
