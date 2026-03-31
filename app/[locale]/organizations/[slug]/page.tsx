"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Building2, Globe, Mail, Phone, Users, GraduationCap, Loader2, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Organization } from "@/types/organizations"

export default function OrganizationProfilePage() {
    const params = useParams()
    const slug = params.slug as string
    const [organization, setOrganization] = useState<Organization | null>(null)
    const [stats, setStats] = useState<{ mentors: number; mentees: number; sessions: number } | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (slug) {
            fetchOrganization()
        }
    }, [slug])

    const fetchOrganization = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/organizations/${slug}`)
            if (!response.ok) {
                throw new Error("Organização não encontrada")
            }

            const data = await response.json()
            setOrganization(data.organization)
            setStats(data.stats)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao carregar organização")
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

    if (error || !organization) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Organização não encontrada</h2>
                    <p className="text-gray-600 mb-6">{error || "A organização que você procura não existe."}</p>
                    <Link
                        href="/organizations"
                        className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Ver todas as organizações
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-start gap-6">
                        {/* Logo */}
                        <div className="flex-shrink-0">
                            {organization.logo_url ? (
                                <img
                                    src={organization.logo_url}
                                    alt={organization.name}
                                    className="w-24 h-24 rounded-lg object-cover"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                                    {organization.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{organization.name}</h1>
                            <p className="text-gray-600 mb-4">{organization.description}</p>

                            {/* Contact Info */}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                {organization.website && (
                                    <a
                                        href={organization.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 hover:text-indigo-600"
                                    >
                                        <Globe className="w-4 h-4" />
                                        Website
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                                {organization.contact_email && (
                                    <a
                                        href={`mailto:${organization.contact_email}`}
                                        className="flex items-center gap-1 hover:text-indigo-600"
                                    >
                                        <Mail className="w-4 h-4" />
                                        {organization.contact_email}
                                    </a>
                                )}
                                {organization.contact_phone && (
                                    <a
                                        href={`tel:${organization.contact_phone}`}
                                        className="flex items-center gap-1 hover:text-indigo-600"
                                    >
                                        <Phone className="w-4 h-4" />
                                        {organization.contact_phone}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <GraduationCap className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.mentors}</p>
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
                                    <p className="text-2xl font-bold text-gray-900">{stats.mentees}</p>
                                    <p className="text-sm text-gray-600">Mentees</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.sessions}</p>
                                    <p className="text-sm text-gray-600">Sessões Realizadas</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* CTA */}
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Interessado em participar?
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Entre em contato com a organização para saber mais sobre oportunidades de mentoria.
                    </p>
                    {organization.contact_email && (
                        <a
                            href={`mailto:${organization.contact_email}`}
                            className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Entrar em Contato
                        </a>
                    )}
                </div>
            </div>
        </div>
    )
}
