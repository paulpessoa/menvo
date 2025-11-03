"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { OrganizationForm } from "@/components/organizations/OrganizationForm"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function OrganizationSettingsPage() {
    const params = useParams()
    const router = useRouter()
    const slug = params.slug as string
    const [orgId, setOrgId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

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

    if (!orgId) return null

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <Link
                        href={`/organizations/${slug}/dashboard`}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Configurações da Organização</h1>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <OrganizationForm organizationId={orgId} />
                </div>
            </div>
        </div>
    )
}
