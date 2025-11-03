"use client"

import { useEffect, useState } from "react"
import { Building2, ChevronDown } from "lucide-react"
import Link from "next/link"

interface Organization {
    id: string
    name: string
    slug: string
    logo_url?: string
    role: string
}

export function OrganizationSwitcher() {
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchOrganizations()
    }, [])

    const fetchOrganizations = async () => {
        try {
            const response = await fetch("/api/user/organizations")
            if (response.ok) {
                const data = await response.json()
                const adminOrgs = data.organizations?.filter(
                    (org: any) => org.role === "admin" && org.status === "active"
                )
                setOrganizations(adminOrgs || [])
            }
        } catch (err) {
            console.error("Error fetching organizations:", err)
        } finally {
            setLoading(false)
        }
    }

    if (loading || organizations.length === 0) {
        return null
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <Building2 className="w-4 h-4" />
                <span>Organizações</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                        <div className="p-2">
                            {organizations.map((org) => (
                                <Link
                                    key={org.id}
                                    href={`/organizations/${org.slug}/dashboard`}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    {org.logo_url ? (
                                        <img src={org.logo_url} alt={org.name} className="w-8 h-8 rounded object-cover" />
                                    ) : (
                                        <div className="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center">
                                            <Building2 className="w-4 h-4 text-indigo-600" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{org.name}</p>
                                        <p className="text-xs text-gray-500">Admin</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <div className="border-t border-gray-200 p-2">
                            <Link
                                href="/organizations"
                                onClick={() => setIsOpen(false)}
                                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                Ver todas as organizações
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
