"use client"

import { useEffect, useState } from "react"
import { Loader2, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ActivityItem {
    id: string
    type: string
    message: string
    actor?: {
        id: string
        full_name?: string
        avatar_url?: string
    }
    target?: {
        id: string
        full_name?: string
        avatar_url?: string
    }
    metadata?: Record<string, any>
    created_at: string
}

interface ActivityFeedData {
    activities: ActivityItem[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

interface ActivityFeedProps {
    organizationId: string
    limit?: number
}

export function ActivityFeed({ organizationId, limit = 20 }: ActivityFeedProps) {
    const [data, setData] = useState<ActivityFeedData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)

    useEffect(() => {
        fetchActivities(currentPage)
    }, [organizationId, currentPage])

    const fetchActivities = async (page: number) => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(
                `/api/organizations/${organizationId}/dashboard/activity?page=${page}&limit=${limit}`
            )

            if (!response.ok) {
                throw new Error("Erro ao carregar atividades")
            }

            const result = await response.json()
            setData(result)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao carregar dados")
        } finally {
            setLoading(false)
        }
    }

    const getRelativeTime = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), {
                addSuffix: true,
                locale: ptBR
            })
        } catch {
            return "Data inválida"
        }
    }

    const getActivityIcon = (type: string) => {
        // Return appropriate icon based on activity type
        switch (type) {
            case "member_joined":
                return "👋"
            case "member_left":
                return "👋"
            case "member_invited":
                return "✉️"
            case "appointment_created":
                return "📅"
            case "appointment_completed":
                return "✅"
            case "appointment_cancelled":
                return "❌"
            case "organization_created":
                return "🎉"
            case "organization_approved":
                return "✅"
            case "settings_updated":
                return "⚙️"
            default:
                return "📌"
        }
    }

    if (loading && !data) {
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

    if (!data || data.activities.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Nenhuma atividade recente</p>
                <p className="text-sm text-gray-500 mt-1">
                    As atividades dos últimos 30 dias aparecerão aqui
                </p>
            </div>
        )
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Atividades Recentes</h3>
                <p className="text-sm text-gray-500 mt-1">
                    Últimos 30 dias • {data.pagination.total} atividades
                </p>
            </div>

            {/* Activity Timeline */}
            <div className="divide-y divide-gray-200">
                {data.activities.map((activity) => (
                    <div key={activity.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-4">
                            {/* Avatar or Icon */}
                            <div className="flex-shrink-0">
                                {activity.actor?.avatar_url ? (
                                    <img
                                        src={activity.actor.avatar_url}
                                        alt={activity.actor.full_name || "Usuário"}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-lg">
                                        {getActivityIcon(activity.type)}
                                    </div>
                                )}
                            </div>

                            {/* Activity Content */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900">{activity.message}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {getRelativeTime(activity.created_at)}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Página {data.pagination.page} de {data.pagination.totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1 || loading}
                            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() =>
                                setCurrentPage((prev) => Math.min(data.pagination.totalPages, prev + 1))
                            }
                            disabled={currentPage === data.pagination.totalPages || loading}
                            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
