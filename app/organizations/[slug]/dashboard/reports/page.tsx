"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Download, Loader2 } from "lucide-react"
import Link from "next/link"

export default function OrganizationReportsPage() {
    const params = useParams()
    const router = useRouter()
    const slug = params.slug as string
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
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Relatórios e Métricas</h1>
                        </div>
                        <button className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Exportar CSV
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                    <p className="text-gray-600">
                        Página de relatórios em desenvolvimento. Aqui você poderá visualizar métricas
                        detalhadas e exportar relatórios.
                    </p>
                </div>
            </div>
        </div>
    )
}
