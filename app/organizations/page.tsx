"use client"

import { useEffect, useState } from "react"
import { Building2, Search, Loader2, Plus } from "lucide-react"
import { OrganizationCard } from "@/components/organizations/OrganizationCard"
import { Organization } from "@/types/organizations"
import Link from "next/link"

export default function OrganizationsPage() {
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [typeFilter, setTypeFilter] = useState<string>("")
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)

    useEffect(() => {
        fetchOrganizations()
    }, [typeFilter, page])

    const fetchOrganizations = async () => {
        setLoading(true)

        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "12"
            })

            if (typeFilter) {
                params.append("type", typeFilter)
            }

            if (searchQuery) {
                params.append("search", searchQuery)
            }

            const response = await fetch(`/api/organizations?${params}`)
            if (!response.ok) {
                throw new Error("Erro ao carregar organizações")
            }

            const data = await response.json()

            if (page === 1) {
                setOrganizations(data.organizations || [])
            } else {
                setOrganizations((prev) => [...prev, ...(data.organizations || [])])
            }

            setHasMore(data.pagination?.page < data.pagination?.totalPages)
        } catch (err) {
            console.error("Error fetching organizations:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = () => {
        setPage(1)
        fetchOrganizations()
    }

    const filteredOrganizations = organizations.filter((org) =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Organizações</h1>
                            <p className="text-gray-600">
                                Descubra organizações que oferecem programas de mentoria
                            </p>
                        </div>
                        <Link
                            href="/organizations/new"
                            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Criar Organização
                        </Link>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar organizações..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        {/* Type Filter */}
                        <select
                            value={typeFilter}
                            onChange={(e) => {
                                setTypeFilter(e.target.value)
                                setPage(1)
                            }}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                        >
                            <option value="">Todos os tipos</option>
                            <option value="company">Empresa</option>
                            <option value="ngo">ONG</option>
                            <option value="hackathon">Hackathon</option>
                            <option value="sebrae">SEBRAE</option>
                            <option value="community">Comunidade</option>
                            <option value="other">Outro</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading && page === 1 ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                ) : filteredOrganizations.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                        <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Nenhuma organização encontrada
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {searchQuery || typeFilter
                                ? "Tente ajustar seus filtros de busca"
                                : "Seja o primeiro a criar uma organização"}
                        </p>
                        <Link
                            href="/organizations/new"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Criar Organização
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Organizations Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredOrganizations.map((org) => (
                                <OrganizationCard key={org.id} organization={org} />
                            ))}
                        </div>

                        {/* Load More */}
                        {hasMore && !loading && (
                            <div className="mt-8 text-center">
                                <button
                                    onClick={() => setPage((p) => p + 1)}
                                    className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Carregar mais
                                </button>
                            </div>
                        )}

                        {loading && page > 1 && (
                            <div className="mt-8 flex justify-center">
                                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
