import { createClient } from "@/utils/supabase/client"

export interface AdminStats {
  overview: {
    totalUsers: number
    growthUsers: number
    totalMentors: number
    growthMentors: number
    totalMentees: number
    growthMentees: number
    totalCompanies: number
    growthCompanies: number
  }
  mentorships: {
    totalSessions: number
    completedSessions: number
    cancelledSessions: number
    totalHours: number
    avgDuration: number
    completionRate: number
    cancellationRate: number
  }
  ratings: {
    avgRating: number
    totalReviews: number
    distribution: { stars: number; count: number; percentage: number }[]
    nps: number
  }
}

export const adminReportsService = {
  async getOverviewStats(): Promise<AdminStats['overview']> {
    const supabase = createClient()

    // Buscas em paralelo para performance
    const [
      { count: totalUsers },
      { count: totalMentors },
      { count: totalMentees },
      { count: totalCompanies }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('user_roles').select('*, roles!inner(*)', { count: 'exact', head: true }).eq('roles.name', 'mentor'),
      supabase.from('user_roles').select('*, roles!inner(*)', { count: 'exact', head: true }).eq('roles.name', 'mentee'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).not('company', 'is', null)
    ])

    // Cálculo simplificado de crescimento (mock por enquanto até termos histórico)
    return {
      totalUsers: totalUsers || 0,
      growthUsers: 0,
      totalMentors: totalMentors || 0,
      growthMentors: 0,
      totalMentees: totalMentees || 0,
      growthMentees: 0,
      totalCompanies: totalCompanies || 0,
      growthCompanies: 0
    }
  },

  async getMentorshipStats(): Promise<AdminStats['mentorships']> {
    const supabase = createClient()

    const [
      { count: total },
      { count: completed },
      { count: cancelled }
    ] = await Promise.all([
      supabase.from('appointments').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'cancelled')
    ])

    const totalSessions = total || 0
    const completedSessions = completed || 0
    const cancelledSessions = cancelled || 0
    
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0
    const cancellationRate = totalSessions > 0 ? (cancelledSessions / totalSessions) * 100 : 0

    return {
      totalSessions,
      completedSessions,
      cancelledSessions,
      totalHours: completedSessions * 0.75, // Assumindo 45 min por sessão
      avgDuration: 45,
      completionRate: Number(completionRate.toFixed(1)),
      cancellationRate: Number(cancellationRate.toFixed(1))
    }
  },

  async getRatingStats(): Promise<AdminStats['ratings']> {
    const supabase = createClient()

    // Buscar todas as avaliações (simplificado para MVP)
    const { data: reviews } = await supabase
      .from('appointments')
      .select('rating')
      .not('rating', 'is', null)

    if (!reviews || reviews.length === 0) {
      return {
        avgRating: 0,
        totalReviews: 0,
        distribution: [],
        nps: 0
      }
    }

    const total = reviews.length
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0)
    const avg = sum / total

    const dist = [5, 4, 3, 2, 1].map(stars => {
      const count = reviews.filter(r => r.rating === stars).length
      return {
        stars,
        count,
        percentage: Number(((count / total) * 100).toFixed(1))
      }
    })

    return {
      avgRating: Number(avg.toFixed(1)),
      totalReviews: total,
      distribution: dist,
      nps: 0 // Cálculo de NPS requer lógica específica de promotores/detratores
    }
  }
}
