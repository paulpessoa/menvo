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

/**
 * Client-side wrapper around GET /api/admin/reports. Used to query
 * `profiles`/`user_roles` straight from the browser
 * (docs/COMMUNITY_CONTACT_PLAN.md §13); kept as a thin fetch layer with the
 * same method names so /dashboard/admin/reports didn't need to change.
 */
export const adminReportsService = {
  async getUserGrowth(startDate: string = "2020-01-01"): Promise<TimeSeriesData[]> {
    const res = await fetch(`/api/admin/reports?since=${encodeURIComponent(startDate)}`)
    if (!res.ok) throw new Error("Erro ao carregar crescimento de usuários")
    const { growth } = await res.json()
    return growth.users
  },

  async getDashboardStats(): Promise<AdminStats["overview"]> {
    const res = await fetch("/api/admin/reports")
    if (!res.ok) throw new Error("Erro ao carregar estatísticas")
    const { overview } = await res.json()
    return overview
  }
}
