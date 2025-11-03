"use client"

import { useEffect, useState } from "react"
import { Building2, Calendar, Shield, User, Users, Loader2, ExternalLink, LogOut } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface OrganizationMembership {
    id: string
    role: "admin" | "mentor" | "mentee"
    status: string
    activated_at?: string
    expires_at?: string
    organization: {
        id: string
        name: string
        slug: string
        type: string
        logo_url?: string
    }
}

interface MyOrganizationsProps {
    onLeave?: () => void
}

export function MyOrganizations({ onLeave }: MyOrganizationsProps) {
    const [memberships, setMemberships] = useState<OrganizationMembership[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [leavingId, setLeavingId] = useState<string | null>(null)
    const [confirmLeaveId, setConfirmLeaveId] = useState<string | null>(null)

    useEffect(() => {
        fetchMemberships()
    }, [])

    const fetchMemberships = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch("/api/user/organizations")
            if (!response.ok) {
                throw new Error("Erro ao carregar organizações")
            }

            const data = await response.json()
            // Filter only active memberships
            const active = data.organizations?.filter(
                (m: OrganizationMembership) => m.status === "active"
            )
            setMemberships(active || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao carregar dados")
        } finally {
            setLoading(false)
        }
    }

    const handleLeave = async (membershipId: string, orgName: string) => {
        if (confirmLeaveId !== membershipId) {
            setConfirmLeaveId(membershipId)
            return
        }

        setLeavingId(membershipId)
        setError(null)

        try {
            const membership = memberships.find((m) => m.id === membershipId)
            if (!membership) return

            const response = await fetch(
                `/api/organizations/${membership.organization.id}/members/${membershipId}`,
                {
                    method: "DELETE"
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Erro ao sair da organização")
            }

            // Remove from list
            setMemberships((prev) => prev.filter((m) => m.id !== membershipId))
            setConfirmLeaveId(null)
            onLeave?.()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao sair da organização")
        } finally {
            setLeavingId(null)
        }
    }

    const getRoleLabel = (role: string) => {
        const labels = {
            admin: "Administrador",
            mentor: "Mentor",
            mentee: "Mentee"
        }
        return labels[role as keyof typeof labels] || role
    }

    const getRoleIcon = (role: string) => {
        switch (role) {
            case "admin":
                return <Shield className="w-4 h-4" />
            case "mentor":
                return <Users className="w-4 h-4" />
            case "mentee":
                return <User className="w-4 h-4" />
            default:
                return <User className="w-4 h-4" />
        }
    }

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "admin":
                return "bg-purple-100 text-purple-700"
            case "mentor":
                return "bg-indigo-100 text-indigo-700"
            case "mentee":
                return "bg-green-100 text-green-700"
            default:
                return "bg-gray-100 text-gray-700"
        }
    }

    const getRelativeTime = (dateString?: string) => {
        if (!dateString) return null
        try {
            return formatDistanceToNow(new Date(dateString), {
                addSuffix: true,
                locale: ptBR
            })
        } catch {
            return null
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        )
    }

    if (error && memberships.length === 0) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
            </div>
        )
    }

    if (memberships.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Você não está em nenhuma organização
                </h3>
                <p className="text-gray-600 mb-4">
                    Aceite convites de organizações para começar a participar de programas de mentoria.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Organizations List */}
            <div className="space-y-3">
                {memberships.map((membership) => (
                    <div
                        key={membership.id}
                        className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start gap-4">
                            {/* Organization Logo */}
                            <div className="flex-shrink-0">
                                {membership.organization.logo_url ? (
                                    <img
                                        src={membership.organization.logo_url}
                                        alt={membership.organization.name}
                                        className="w-14 h-14 rounded-lg object-cover"
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                                        {membership.organization.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Organization Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                            {membership.organization.name}
                                        </h3>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {/* Role Badge */}
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                                                    membership.role
                                                )}`}
                                            >
                                                {getRoleIcon(membership.role)}
                                                {getRoleLabel(membership.role)}
                                            </span>

                                            {/* Type Badge */}
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                {membership.organization.type}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        {membership.role === "admin" && (
                                            <a
                                                href={`/organizations/${membership.organization.slug}/dashboard`}
                                                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Ir para dashboard"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Metadata */}
                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                    {membership.activated_at && (
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            <span>Membro {getRelativeTime(membership.activated_at)}</span>
                                        </div>
                                    )}
                                    {membership.expires_at && (
                                        <div className="flex items-center gap-1 text-orange-600">
                                            <Calendar className="w-4 h-4" />
                                            <span>Expira {getRelativeTime(membership.expires_at)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Leave Button */}
                                {confirmLeaveId === membership.id ? (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() =>
                                                handleLeave(membership.id, membership.organization.name)
                                            }
                                            disabled={leavingId === membership.id}
                                            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                        >
                                            {leavingId === membership.id ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Saindo...
                                                </>
                                            ) : (
                                                <>
                                                    <LogOut className="w-4 h-4" />
                                                    Confirmar Saída
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setConfirmLeaveId(null)}
                                            disabled={leavingId === membership.id}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <p className="text-xs text-gray-600">
                                            Seus agendamentos futuros serão cancelados
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setConfirmLeaveId(membership.id)}
                                        className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sair da organização
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
