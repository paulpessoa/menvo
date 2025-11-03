"use client"

import { useEffect, useState } from "react"
import { Building2, Search, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react"
import Link from "next/link"
import { Organization } from "@/types/organizations"

export default function AdminOrganizationsPage() {
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("")

    useEffect(() => {
        fetchOrganizations()
    }, [statusFilter])

    const fetchOrganizations = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (statusFilter) params.append("status", statusFilter)

            const response = await fetch(`/api/admin/organizations?${params}`)
            if (response.ok) {
                const result = await response.json()
                console.log("API Response:", result)
                // API returns { data: { organizations: [...] } }
                const data = result.data || result
                console.log("Organizations:", data.organizations)
                setOrganizations(data.organizations || [])
            } else {
                console.error("API Error:", response.status, await response.text())
            }
        } catch (err) {
            console.error("Error fetching organizations:", err)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const badges = {
            pending_approval: { icon: Clock, color: "bg-yellow-100 text-yellow-700", label: "Pendente" },
            active: { icon: CheckCircle, color: "bg-green-100 text-green-700", label: "Ativo" },
            suspended: { icon: XCircle, color: "bg-red-100 text-red-700", label: "Suspenso" },
            inactive: { icon: XCircle, color: "bg-gray-100 text-gray-700", label: "Inativo" }
        }
        const badge = badges[status as keyof typeof badges] || badges.inactive
        const Icon = badge.icon
        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                <Icon className="w-3 h-3" />
                {badge.label}
            </span>
        )
    }

    const filteredOrgs = organizations.filter(org =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Gerenciar Organizações</h1>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar organizações..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                            <option value="">Todos os status</option>
                            <option value="pending_approval">Pendente</option>
                            <option value="active">Ativo</option>
                            <option value="suspended">Suspenso</option>
                            <option value="inactive">Inativo</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                ) : filteredOrgs.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                        <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Nenhuma organização encontrada</p>
                    </div>
                ) : (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Organização
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Criado em
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredOrgs.map((org) => (
                                    <tr key={org.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {org.logo_url ? (
                                                    <img src={org.logo_url} alt={org.name} className="w-10 h-10 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                                        <Building2 className="w-5 h-5 text-indigo-600" />
                                                    </div>
                                                )}
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{org.name}</div>
                                                    <div className="text-sm text-gray-500">{org.slug}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-900">{org.type}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(org.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(org.created_at).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link
                                                href={`/admin/organizations/${org.id}`}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                Ver detalhes
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
