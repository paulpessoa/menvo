"use client"

import { useEffect, useState } from "react"
import { Building2, ChevronDown, Check } from "lucide-react"

interface Organization {
    id: string
    name: string
    logo_url?: string
}

interface OrganizationFilterProps {
    selectedOrganizationId?: string | null
    onOrganizationChange: (organizationId: string | null) => void
    className?: string
}

export function OrganizationFilter({
    selectedOrganizationId,
    onOrganizationChange,
    className = ""
}: OrganizationFilterProps) {
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [loading, setLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        fetchOrganizations()
    }, [])

    const fetchOrganizations = async () => {
        setLoading(true)

        try {
            const response = await fetch("/api/user/organizations")
            if (response.ok) {
                const data = await response.json()
                // Filter only active memberships
                const activeOrgs = data.organizations?.filter(
                    (org: any) => org.status === "active"
                )
                setOrganizations(activeOrgs || [])
            }
        } catch (err) {
            console.error("Error fetching organizations:", err)
        } finally {
            setLoading(false)
        }
    }

    const selectedOrg = organizations.find((org) => org.id === selectedOrganizationId)

    // Don't show filter if user has no organizations
    if (!loading && organizations.length === 0) {
        return null
    }

    return (
        <div className={`relative ${className}`}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Organização
            </label>

            {/* Dropdown Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={loading}
                className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {loading ? (
                        <span className="text-gray-500 text-sm">Carregando...</span>
                    ) : selectedOrg ? (
                        <>
                            {selectedOrg.logo_url ? (
                                <img
                                    src={selectedOrg.logo_url}
                                    alt={selectedOrg.name}
                                    className="w-5 h-5 rounded object-cover flex-shrink-0"
                                />
                            ) : (
                                <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            )}
                            <span className="text-sm font-medium text-gray-900 truncate">
                                {selectedOrg.name}
                            </span>
                        </>
                    ) : (
                        <>
                            <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-600">Todos os mentores</span>
                        </>
                    )}
                </div>
                <ChevronDown
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && !loading && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

                    {/* Menu */}
                    <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {/* All Mentors Option */}
                        <button
                            onClick={() => {
                                onOrganizationChange(null)
                                setIsOpen(false)
                            }}
                            className="w-full flex items-center justify-between gap-2 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-gray-900">Todos os mentores</span>
                            </div>
                            {!selectedOrganizationId && (
                                <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                            )}
                        </button>

                        {/* Divider */}
                        <div className="border-t border-gray-200" />

                        {/* Organization Options */}
                        {organizations.map((org) => (
                            <button
                                key={org.id}
                                onClick={() => {
                                    onOrganizationChange(org.id)
                                    setIsOpen(false)
                                }}
                                className="w-full flex items-center justify-between gap-2 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {org.logo_url ? (
                                        <img
                                            src={org.logo_url}
                                            alt={org.name}
                                            className="w-5 h-5 rounded object-cover flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-5 h-5 rounded bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium flex-shrink-0">
                                            {org.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <span className="text-sm text-gray-900 truncate">{org.name}</span>
                                </div>
                                {selectedOrganizationId === org.id && (
                                    <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
