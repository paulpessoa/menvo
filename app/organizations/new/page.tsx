"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { OrganizationForm } from "@/components/organizations/OrganizationForm"
import { ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"

export default function NewOrganizationPage() {
    const router = useRouter()
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)
    const [showSuccess, setShowSuccess] = useState(false)

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        try {
            const supabase = createClient()
            const { data: { user }, error } = await supabase.auth.getUser()

            if (user && !error) {
                setIsAuthenticated(true)
            } else {
                router.push("/auth/login?redirect=/organizations/new")
            }
        } catch (err) {
            router.push("/auth/login?redirect=/organizations/new")
        } finally {
            setLoading(false)
        }
    }

    const handleSuccess = () => {
        setShowSuccess(true)
        setTimeout(() => {
            router.push("/organizations")
        }, 3000)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Carregando...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    if (showSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Organização Criada com Sucesso!
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Sua organização foi criada e está aguardando aprovação da equipe Menvo. Você
                        receberá um email quando for aprovada.
                    </p>
                    <p className="text-sm text-gray-500">Redirecionando...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/organizations"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para organizações
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Criar Nova Organização</h1>
                    <p className="text-gray-600">
                        Preencha as informações abaixo para criar sua organização. Após a criação, ela
                        passará por uma análise da equipe Menvo antes de ser aprovada.
                    </p>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-blue-900 mb-2">O que acontece depois?</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Sua organização será criada com status "Aguardando Aprovação"</li>
                        <li>• A equipe Menvo analisará as informações fornecidas</li>
                        <li>• Você receberá um email quando a organização for aprovada</li>
                        <li>• Após aprovação, você poderá convidar mentores e mentees</li>
                    </ul>
                </div>

                {/* Form */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <OrganizationForm onSuccess={handleSuccess} />
                </div>
            </div>
        </div>
    )
}
