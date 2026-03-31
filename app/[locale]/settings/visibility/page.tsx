"use client"

import { VisibilitySettings } from "@/components/organizations/VisibilitySettings"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function MentorVisibilitySettingsPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <Link
                        href="/settings"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para configurações
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Configurações de Visibilidade</h1>
                    <p className="text-gray-600">Configure quem pode ver seu perfil de mentor</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <VisibilitySettings />
            </div>
        </div>
    )
}
