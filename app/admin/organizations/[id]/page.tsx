"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle, XCircle, Loader2, Users, GraduationCap } from "lucide-react"
import Link from "next/link"
import { Organization } from "@/types/organizations"

export default function AdminOrganizationDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string
    const [organization, setOrganization] = useState<Organization | null>(null)
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        if (id) {
            fetchOrganization()
        }
    }, [id])

    const fetchOrganization = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/admin/organizations/${id}`)
            if (response.ok) {
                const result = await response.json()
                setOrganization(result.data.organization)
                setStats(result.data.stats)
            }
        } catch (err) {
            console.error("Error fetching organization:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async () => {
        if (!confirm("Aprovar esta organização?")) return

        setActionLoading(true)
        try {
            const response = await fetch(`/api/organizations/${id}/approve`, {
                method: "POST"
            })
            if (response.ok) {
                fetchOrganization()
            }
        } catch (err) {
            console.error("Error approving organization:", err)
        } finally {
            setActionLoading(false)
        }
    }

    const handleSuspend = async () => {
        if (!confirm("Suspender esta organização?")) return

        setActionLoading(true)
        try {
            const response = await fetch(`/api/admin/organizations/${id}/suspend`, {
                method: "POST"
            })
            if (response.ok) {
                fetchOrganization()
            }
        } catch (err) {
            console.error("Error suspending organization:", err)
        } finally {
            setActionLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        )
    }

    if (!organization) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Organização não encontrada</p>
                    <Link href="/admin/organizations" className="text-indigo-600 hover:text-indigo-700">
                        Voltar para lista
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <Link
                        href="/admin/organizations"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para lista
                    </Link>
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            {organization.logo_url ? (
                                <img src={organization.logo_url} alt={organization.name} className="w-16 h-16 rounded-lg object-cover" />
                            ) : (
                                <div className="w-16 h-16 rounded-lg bg-indigo-100 flex items-center justify-center">
                                    <Users className="w-8 h-8 text-indigo-600" />
                                </div>
                            )}
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
                                <p className="text-gray-600">{organization.type}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {organization.status === "pending_approval" && (
                                <button
                                    onClick={handleApprove}
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Aprovar
                                </button>
                            )}
                            {organization.status === "active" && (
                                <button
                                    onClick={handleSuspend}
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Suspender
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações</h2>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Status</dt>
                            <dd className="mt-1 text-sm text-gray-900">{organization.status}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Tipo</dt>
                            <dd className="mt-1 text-sm text-gray-900">{organization.type}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Email de Contato</dt>
                            <dd className="mt-1 text-sm text-gray-900">{organization.contact_email}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Telefone</dt>
                            <dd className="mt-1 text-sm text-gray-900">{organization.contact_phone || "N/A"}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Website</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {organization.website ? (
                                    <a href={organization.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700">
                                        {organization.website}
                                    </a>
                                ) : "N/A"}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Criado em</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {new Date(organization.created_at).toLocaleDateString('pt-BR')}
                            </dd>
                        </div>
                    </dl>
                </div>

                {organization.description && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Descrição</h2>
                        <p className="text-gray-600">{organization.description}</p>
                    </div>
                )}

                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <GraduationCap className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.mentors || 0}</p>
                                    <p className="text-sm text-gray-600">Mentores</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Users className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.mentees || 0}</p>
                                    <p className="text-sm text-gray-600">Mentees</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.sessions || 0}</p>
                                    <p className="text-sm text-gray-600">Sessões</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
