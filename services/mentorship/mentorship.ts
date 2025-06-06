import { supabase } from '@/services/auth/supabase'

// =============================================
// INTERFACES E TIPOS
// =============================================

export interface MentorAvailability {
  id?: string
  mentor_id: string
  day_of_week: number // 0=Domingo, 6=Sábado
  start_time: string // HH:MM format
  end_time: string // HH:MM format
  timezone: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface MentorshipSession {
  id?: string
  mentor_id: string
  mentee_id: string
  requested_date: string // YYYY-MM-DD
  requested_start_time: string // HH:MM
  requested_end_time: string // HH:MM
  timezone: string
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled'
  mentor_response?: string
  meeting_link?: string
  topic: string
  description?: string
  mentee_notes?: string
  mentor_notes?: string
  requested_at?: string
  responded_at?: string
  completed_at?: string
  created_at?: string
  updated_at?: string
}

export interface SessionRequest {
  mentor_id: string
  requested_date: string
  requested_start_time: string
  requested_end_time: string
  topic: string
  description?: string
  mentee_notes?: string
  timezone?: string
}

export interface SessionResponse {
  session_id: string
  status: 'confirmed' | 'rejected'
  mentor_response?: string
  meeting_link?: string
}

// =============================================
// MENTOR AVAILABILITY SERVICE
// =============================================

export const mentorAvailabilityService = {
  // Obter disponibilidade de um mentor
  getMentorAvailability: async (mentorId: string) => {
    const { data, error } = await supabase
      .from('mentor_availability')
      .select('*')
      .eq('mentor_id', mentorId)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) throw error
    return data as MentorAvailability[]
  },

  // Adicionar horário de disponibilidade
  addAvailability: async (availability: Omit<MentorAvailability, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('mentor_availability')
      .insert([availability])
      .select()
      .single()

    if (error) throw error
    return data as MentorAvailability
  },

  // Atualizar disponibilidade
  updateAvailability: async (id: string, updates: Partial<MentorAvailability>) => {
    const { data, error } = await supabase
      .from('mentor_availability')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as MentorAvailability
  },

  // Remover disponibilidade (soft delete)
  removeAvailability: async (id: string) => {
    const { error } = await supabase
      .from('mentor_availability')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
  },

  // Definir disponibilidade completa do mentor (substitui todas)
  setMentorAvailability: async (mentorId: string, availabilities: Omit<MentorAvailability, 'id' | 'mentor_id' | 'created_at' | 'updated_at'>[]) => {
    // Primeiro, desativar todas as disponibilidades existentes
    await supabase
      .from('mentor_availability')
      .update({ is_active: false })
      .eq('mentor_id', mentorId)

    // Depois, inserir as novas disponibilidades
    const newAvailabilities = availabilities.map(av => ({
      ...av,
      mentor_id: mentorId
    }))

    const { data, error } = await supabase
      .from('mentor_availability')
      .insert(newAvailabilities)
      .select()

    if (error) throw error
    return data as MentorAvailability[]
  }
}

// =============================================
// MENTORSHIP SESSIONS SERVICE
// =============================================

export const mentorshipSessionsService = {
  // Solicitar sessão de mentoria
  requestSession: async (request: SessionRequest) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const sessionData = {
      ...request,
      mentee_id: user.id,
      timezone: request.timezone || 'America/Sao_Paulo',
      status: 'pending' as const
    }

    const { data, error } = await supabase
      .from('mentorship_sessions')
      .insert([sessionData])
      .select(`
        *,
        mentor:users!mentor_id(first_name, last_name, email),
        mentee:users!mentee_id(first_name, last_name, email)
      `)
      .single()

    if (error) throw error
    return data
  },

  // Responder a uma solicitação (mentor)
  respondToSession: async (response: SessionResponse) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const updates = {
      status: response.status,
      mentor_response: response.mentor_response,
      meeting_link: response.meeting_link,
      responded_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('mentorship_sessions')
      .update(updates)
      .eq('id', response.session_id)
      .eq('mentor_id', user.id) // Garantir que só o mentor pode responder
      .select(`
        *,
        mentor:users!mentor_id(first_name, last_name, email),
        mentee:users!mentee_id(first_name, last_name, email)
      `)
      .single()

    if (error) throw error
    return data
  },

  // Obter sessões do mentor
  getMentorSessions: async (mentorId?: string, status?: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    let query = supabase
      .from('mentorship_sessions')
      .select(`
        *,
        mentor:users!mentor_id(first_name, last_name, email, avatar_url),
        mentee:users!mentee_id(first_name, last_name, email, avatar_url)
      `)
      .eq('mentor_id', mentorId || user.id)
      .order('requested_date', { ascending: false })
      .order('requested_start_time', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  // Obter sessões do mentorado
  getMenteeSessions: async (menteeId?: string, status?: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    let query = supabase
      .from('mentorship_sessions')
      .select(`
        *,
        mentor:users!mentor_id(first_name, last_name, email, avatar_url),
        mentee:users!mentee_id(first_name, last_name, email, avatar_url)
      `)
      .eq('mentee_id', menteeId || user.id)
      .order('requested_date', { ascending: false })
      .order('requested_start_time', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  // Marcar sessão como completa
  completeSession: async (sessionId: string, mentorNotes?: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { data, error } = await supabase
      .from('mentorship_sessions')
      .update({
        status: 'completed',
        mentor_notes: mentorNotes,
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('mentor_id', user.id) // Só o mentor pode marcar como completa
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Cancelar sessão
  cancelSession: async (sessionId: string, reason?: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { data, error } = await supabase
      .from('mentorship_sessions')
      .update({
        status: 'cancelled',
        mentor_response: reason
      })
      .eq('id', sessionId)
      .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`) // Mentor ou mentee podem cancelar
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Obter sessão específica
  getSession: async (sessionId: string) => {
    const { data, error } = await supabase
      .from('mentorship_sessions')
      .select(`
        *,
        mentor:users!mentor_id(first_name, last_name, email, avatar_url),
        mentee:users!mentee_id(first_name, last_name, email, avatar_url)
      `)
      .eq('id', sessionId)
      .single()

    if (error) throw error
    return data
  },

  // Obter estatísticas do mentor
  getMentorStats: async (mentorId: string) => {
    const { data: sessions, error } = await supabase
      .from('mentorship_sessions')
      .select('status')
      .eq('mentor_id', mentorId)

    if (error) throw error

    const stats = {
      total: sessions.length,
      pending: sessions.filter(s => s.status === 'pending').length,
      confirmed: sessions.filter(s => s.status === 'confirmed').length,
      completed: sessions.filter(s => s.status === 'completed').length,
      rejected: sessions.filter(s => s.status === 'rejected').length,
      cancelled: sessions.filter(s => s.status === 'cancelled').length
    }

    return stats
  }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

export const mentorshipUtils = {
  // Converter dia da semana para nome
  getDayName: (dayOfWeek: number, locale: string = 'pt-BR') => {
    const days = {
      'pt-BR': ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
      'en-US': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    }
    return days[locale as keyof typeof days]?.[dayOfWeek] || days['pt-BR'][dayOfWeek]
  },

  // Formatar horário
  formatTime: (time: string) => {
    return time.substring(0, 5) // Remove segundos se houver
  },

  // Verificar se horário está disponível
  isTimeSlotAvailable: (
    availability: MentorAvailability[],
    dayOfWeek: number,
    startTime: string,
    endTime: string
  ) => {
    return availability.some(slot => 
      slot.day_of_week === dayOfWeek &&
      slot.start_time <= startTime &&
      slot.end_time >= endTime &&
      slot.is_active
    )
  },

  // Gerar slots de horário disponíveis
  generateTimeSlots: (availability: MentorAvailability[], duration: number = 60) => {
    const slots: { day: number, time: string, endTime: string }[] = []
    
    availability.forEach(slot => {
      const start = new Date(`2000-01-01T${slot.start_time}`)
      const end = new Date(`2000-01-01T${slot.end_time}`)
      
      while (start < end) {
        const slotEnd = new Date(start.getTime() + duration * 60000)
        if (slotEnd <= end) {
          slots.push({
            day: slot.day_of_week,
            time: start.toTimeString().substring(0, 5),
            endTime: slotEnd.toTimeString().substring(0, 5)
          })
        }
        start.setTime(start.getTime() + duration * 60000)
      }
    })
    
    return slots
  }
} 