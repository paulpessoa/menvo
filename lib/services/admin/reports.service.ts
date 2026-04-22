import { createClient } from "@/lib/utils/supabase/client"

export interface TimeSeriesData {
    date: string
    count: number
}

export interface AdminStats {
  overview: {
    totalUsers: number
    totalMentors: number
    totalMentees: number
  }
  growth: {
    users: TimeSeriesData[]
  }
}

export const adminReportsService = {
  /**
   * Busca dados históricos de novos usuários
   */
  async getUserGrowth(startDate: string = "2020-01-01"): Promise<TimeSeriesData[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', startDate)
      .order('created_at', { ascending: true })

    if (error) throw error

    // Agrupar por Dia para períodos curtos, ou Mês para períodos longos
    const counts: Record<string, number> = {}
    
    data.forEach(profile => {
        const date = new Date(profile.created_at)
        const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD
        counts[dateKey] = (counts[dateKey] || 0) + 1
    })

    return Object.entries(counts).map(([date, count]) => ({
        date,
        count
    })).sort((a, b) => a.date.localeCompare(b.date))
  },

  async getDashboardStats(): Promise<AdminStats['overview']> {
    const supabase = createClient()

    const [
      { count: totalUsers },
      { count: totalMentors },
      { count: totalMentees }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('user_roles').select('*, roles!inner(*)', { count: 'exact', head: true }).eq('roles.name', 'mentor'),
      supabase.from('user_roles').select('*, roles!inner(*)', { count: 'exact', head: true }).eq('roles.name', 'mentee')
    ])

    return {
      totalUsers: totalUsers || 0,
      totalMentors: totalMentors || 0,
      totalMentees: totalMentees || 0
    }
  }
}
