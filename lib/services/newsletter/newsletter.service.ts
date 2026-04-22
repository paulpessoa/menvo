import { supabase } from '@/services/auth/supabase'

export interface NewsletterSubscription {
  id?: string
  email: string
  name?: string
  whatsapp?: string
  subscribed_at?: string
  consent_given: boolean
  consent_date: string
  marketing_consent?: boolean
  ip_address?: string
  user_agent?: string
  status: 'active' | 'unsubscribed'
  unsubscribed_at?: string
}

export const newsletterService = {
  // Inscrever na newsletter
  subscribe: async (data: {
    email: string
    name?: string
    whatsapp?: string
    consent_given: boolean
    ip_address?: string
    user_agent?: string
  }) => {
    // Verificar se já existe uma inscrição ativa
    const { data: existing, error: checkError } = await supabase
      .from('newsletter_subscriptions')
      .select('*')
      .eq('email', data.email)
      .eq('status', 'active')
      .maybeSingle()

    // Se houve erro na verificação (que não seja "não encontrado"), lance o erro
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    // Se já existe uma inscrição ativa, lance erro
    if (existing) {
      throw new Error('Este email já está inscrito na nossa newsletter')
    }

    const { data: subscription, error } = await supabase
      .from('newsletter_subscriptions')
      .insert([{
        email: data.email,
        name: data.name,
        whatsapp: data.whatsapp,
        consent_given: data.consent_given,
        consent_date: new Date().toISOString(),
        ip_address: data.ip_address,
        user_agent: data.user_agent,
        status: 'active'
      }])
      .select()
      .single()

    if (error) throw error
    return subscription
  },

  // Cancelar inscrição
  unsubscribe: async (email: string) => {
    const { error } = await supabase
      .from('newsletter_subscriptions')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString()
      })
      .eq('email', email)
      .eq('status', 'active')

    if (error) throw error
  },

  // Verificar se email está inscrito
  checkSubscription: async (email: string) => {
    const { data, error } = await supabase
      .from('newsletter_subscriptions')
      .select('*')
      .eq('email', email)
      .eq('status', 'active')
      .maybeSingle()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  // Listar todas as inscrições ativas (admin)
  getActiveSubscriptions: async () => {
    const { data, error } = await supabase
      .from('newsletter_subscriptions')
      .select('*')
      .eq('status', 'active')
      .order('subscribed_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Estatísticas da newsletter (admin)
  getStats: async () => {
    const { data: active, error: activeError } = await supabase
      .from('newsletter_subscriptions')
      .select('id', { count: 'exact' })
      .eq('status', 'active')

    const { data: total, error: totalError } = await supabase
      .from('newsletter_subscriptions')
      .select('id', { count: 'exact' })

    const { data: unsubscribed, error: unsubscribedError } = await supabase
      .from('newsletter_subscriptions')
      .select('id', { count: 'exact' })
      .eq('status', 'unsubscribed')

    if (activeError || totalError || unsubscribedError) {
      throw activeError || totalError || unsubscribedError
    }

    const activeCount = active?.length || 0
    const totalCount = total?.length || 0
    const unsubscribedCount = unsubscribed?.length || 0

    return {
      active: activeCount,
      total: totalCount,
      unsubscribed: unsubscribedCount,
      conversion_rate: totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0
    }
  }
}
