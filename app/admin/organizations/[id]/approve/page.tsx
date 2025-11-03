"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { Organization } from "@/types/organizations"

export default function AdminOrganizationApprovePage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string
    const [organization, setOrganization] = useState<Organization | null>(null)
    const [loading, setLoading] = useState(true)
    const [approving, setApproving] = useState(false)
    const [notes, setNotes] = useState("")

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
                const data = await response.json()
                setOrganization(data.organization)
            }
        } catch (err) {
            console.error("Error fetching organization:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async () => {
        setApproving(true)
        try {
            const response = await fetch(`/api/organizations/${id}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notes })
            })

            if (response.ok) {
                router.push(`/admin/organizations/${id}`)
            }
        } catch (err) {
            console.error("Error approving organization:", err)
        } finally {
            setApproving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        )
    }

    if (!organization || organization.status !== "pending_approval") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">
                        {!organization ? "Organização não encontrada" : "Esta organização não está pendente de aprovação"}
                    </p>
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
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <Link
                        href={`/admin/organizations/${id}`}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para detalhes
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Aprovar Organização</h1>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações da Organização</h2>
                    <dl className="space-y-3">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Nome</dt>
                            <dd className="mt-1 text-sm text-gray-900">{organization.name}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Tipo</dt>
                            <dd className="mt-1 text-sm text-gray-900">{organization.type}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Email de Contato</dt>
                            <dd className="mt-1 text-sm text-gray-900">{organization.contact_email}</dd>
                        </div>
                        {organization.description && (
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Descrição</dt>
                                <dd className="mt-1 text-sm text-gray-900">{organization.description}</dd>
                            </div>
                        )}
                    </dl>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Notas de Aprovação (Opcional)</h2>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Adicione notas sobre a aprovação..."
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleApprove}
                        disabled={approving}
                        className="flex-1 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                        {approving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Aprovando...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Aprovar Organização
                            </>
                        )}
                    </button>
                    <Link
                        href={`/admin/organizations/${id}`}
                        className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Cancelar
                    </Link>
                </div>
            </div>
        </div>
    )
}
