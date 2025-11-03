"use client"

import { useEffect, useState } from "react"
import { Users, GraduationCap, Calendar, TrendingUp, Loader2 } from "lucide-react"

interface OrganizationStatsData {
    totalMentors: number
    totalMentees: number
    monthlyAppointments: number
    completionRate: number
    topTopics: Array<{ topic: string; count: number }>
    activeMentors: number
}

interface OrganizationStatsProps {
    organizationId: string
}

export function OrganizationStats({ organizationId }: OrganizationStatsProps) {
    const [stats, setStats] = useState<OrganizationStatsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchStats()
    }, [organizationId])

    const fetchStats = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(
                `/api/organizations/${organizationId}/dashboard/stats`
            )

            if (!response.ok) {
                throw new Error("Erro ao carregar estatísticas")
            }

            const data = await response.json()
            setStats(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao carregar dados")
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
            </div>
        )
    }

    if (!stats) return null

    return (
        <div className="space-y-6">
            {/* Main Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Mentors */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total de Mentores</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {stats.totalMentors}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {stats.activeMentors} ativos
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-indigo-600" />
                        </div>
                    </div>
                </div>

                {/* Total Mentees */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total de Mentees</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {stats.totalMentees}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                {/* Monthly Appointments */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                Agendamentos (30 dias)
                            </p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {stats.monthlyAppointments}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                {/* Completion Rate */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {stats.completionRate}%
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Topics */}
            {stats.topTopics && stats.topTopics.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Tópicos Mais Populares
                    </h3>
                    <div className="space-y-3">
                        {stats.topTopics.map((item, index) => {
                            const maxCount = stats.topTopics[0].count
                            const percentage = (item.count / maxCount) * 100

                            return (
                                <div key={index}>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-700">{item.topic}</span>
                                        <span className="text-gray-500">{item.count} sessões</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
