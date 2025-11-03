"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { InvitationForm } from "@/components/organizations/InvitationForm"
import { BulkInvitationUpload } from "@/components/organizations/BulkInvitationUpload"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function OrganizationInvitationsPage() {
    const params = useParams()
    const router = useRouter()
    const slug = params.slug as string
    const [orgId, setOrgId] = useState<string | null>(null)
    const [orgName, setOrgName] = useState<string>("")
    const [loading, setLoading] = useState(true)
    const [refreshKey, setRefreshKey] = useState(0)

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
            if (!data.is_admin) {
                router.push(`/organizations/${slug}`)
            }
        } catch (err) {
            router.push("/organizations")
        } finally {
            setLoading(false)
        }
    }

    const handleSuccess = () => {
        setRefreshKey((prev) => prev + 1)
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
                    <h1 className="text-2xl font-bold text-gray-900">Gerenciar Convites</h1>
                    <p className="text-gray-600">{orgName}</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Convidar Membro</h2>
                    <InvitationForm organizationId={orgId} onSuccess={handleSuccess} />
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Convite em Massa</h2>
                    <BulkInvitationUpload organizationId={orgId} onSuccess={handleSuccess} />
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Convites Pendentes</h2>
                    <p className="text-gray-600">Lista de convites pendentes será exibida aqui.</p>
                </div>
            </div>
        </div>
    )
}
