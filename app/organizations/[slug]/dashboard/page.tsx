"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { OrganizationStats } from "@/components/organizations/OrganizationStats"
import { ActivityFeed } from "@/components/organizations/ActivityFeed"
import { Users, Mail, FileText, Settings, Loader2 } from "lucide-react"
import Link from "next/link"

export default function OrganizationDashboardPage() {
    const params = useParams()
    const router = useRouter()
    const slug = params.slug as string
    const [orgId, setOrgId] = useState<string | null>(null)
    const [orgName, setOrgName] = useState<string>("")
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        if (slug) {
            checkAccess()
        }
    }, [slug])

    const checkAccess = async () => {
        setLoading(true)

        try {
            const response = await fetch(`/api/organizations/${slug}`)
            if (!response.ok) {
                router.push("/organizations")
                return
            }

            const data = await response.json()
            setOrgId(data.organization.id)
            setOrgName(data.organization.name)
            setIsAdmin(data.is_admin || false)

            if (!data.is_admin) {
                router.push(`/organizations/${slug}`)
            }
        } catch (err) {
            router.push("/organizations")
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        )
    }

    if (!isAdmin || !orgId) {
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{orgName}</h1>
                            <p className="text-gray-600">Dashboard Administrativo</p>
                        </div>
                        <Link
                            href={`/organizations/${slug}/dashboard/settings`}
                            className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                        >
                            <Settings className="w-4 h-4" />
                            Configurações
                        </Link>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Link
                        href={`/organizations/${slug}/dashboard/members`}
                        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-indigo-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Gerenciar Membros</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                            Visualize e gerencie mentores e mentees da organização
                        </p>
                    </Link>

                    <Link
                        href={`/organizations/${slug}/dashboard/invitations`}
                        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Mail className="w-5 h-5 text-green-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Convites</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                            Envie convites e gerencie convites pendentes
                        </p>
                    </Link>

                    <Link
                        href={`/organizations/${slug}/dashboard/reports`}
                        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-purple-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Relatórios</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                            Visualize métricas e exporte relatórios
                        </p>
                    </Link>
                </div>

                {/* Stats */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas</h2>
                    <OrganizationStats organizationId={orgId} />
                </div>

                {/* Activity Feed */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Atividades Recentes</h2>
                    <ActivityFeed organizationId={orgId} />
                </div>
            </div>
        </div>
    )
}
