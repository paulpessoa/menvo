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
    totalHubResources: number
  }
  growth: {
    users: TimeSeriesData[]
  }
}

export const adminReportsService = {
  /**
   * Busca dados históricos de novos usuários desde Janeiro de 2020
   */
  async getUserGrowth(startDate: string = "2020-01-01"): Promise<TimeSeriesData[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', startDate)
      .order('created_at', { ascending: true })

    if (error) throw error

    // Agrupar por Mês/Ano para o gráfico
    const counts: Record<string, number> = {}
    
    data.forEach(profile => {
        const date = new Date(profile.created_at)
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        counts[monthYear] = (counts[monthYear] || 0) + 1
    })

    // Converter para array e preencher meses vazios se necessário
    return Object.entries(counts).map(([date, count]) => ({
        date,
        count
    }))
  },

  async getDashboardStats(): Promise<AdminStats['overview']> {
    const supabase = createClient()

    const [
      { count: totalUsers },
      { count: totalMentors },
      { count: totalMentees },
      { count: totalHub }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('user_roles').select('*, roles!inner(*)', { count: 'exact', head: true }).eq('roles.name', 'mentor'),
      supabase.from('user_roles').select('*, roles!inner(*)', { count: 'exact', head: true }).eq('roles.name', 'mentee'),
      supabase.from('hub_resources').select('*', { count: 'exact', head: true })
    ])

    return {
      totalUsers: totalUsers || 0,
      totalMentors: totalMentors || 0,
      totalMentees: totalMentees || 0,
      totalHubResources: totalHub || 0
    }
  }
}
