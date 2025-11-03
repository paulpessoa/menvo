"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function AcceptInvitationPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token")
    const [loading, setLoading] = useState(true)
    const [accepting, setAccepting] = useState(false)
    const [invitation, setInvitation] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        if (token) {
            validateToken()
        } else {
            setError("Token de convite inválido")
            setLoading(false)
        }
    }, [token])

    const validateToken = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/organizations/invitations/validate?token=${token}`)
            if (!response.ok) {
                throw new Error("Convite inválido ou expirado")
            }
            const data = await response.json()
            setInvitation(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao validar convite")
        } finally {
            setLoading(false)
        }
    }

    const handleAccept = async () => {
        setAccepting(true)
        setError(null)

        try {
            const response = await fetch("/api/organizations/invitations/accept", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Erro ao aceitar convite")
            }

            setSuccess(true)
            setTimeout(() => {
                router.push("/settings/organizations")
            }, 2000)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao aceitar convite")
        } finally {
            setAccepting(false)
        }
    }

    const handleDecline = async () => {
        try {
            await fetch("/api/organizations/invitations/decline", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token })
            })
            router.push("/organizations")
        } catch (err) {
            setError("Erro ao recusar convite")
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Convite Aceito!</h2>
                    <p className="text-gray-600">Redirecionando...</p>
                </div>
            </div>
        )
    }

    if (error || !invitation) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Convite Inválido</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link
                        href="/organizations"
                        className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Ver Organizações
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                    Convite para Organização
                </h2>
                <div className="mb-6">
                    <p className="text-gray-600 mb-2">Você foi convidado para participar de:</p>
                    <p className="text-xl font-semibold text-gray-900">{invitation.organization?.name}</p>
                    <p className="text-sm text-gray-600 mt-1">Como: {invitation.role}</p>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-3">
                    <button
                        onClick={handleAccept}
                        disabled={accepting}
                        className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                        {accepting && <Loader2 className="w-4 h-4 animate-spin" />}
                        {accepting ? "Aceitando..." : "Aceitar Convite"}
                    </button>
                    <button
                        onClick={handleDecline}
                        disabled={accepting}
                        className="w-full px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                    >
                        Recusar
                    </button>
                </div>
            </div>
        </div>
    )
}
