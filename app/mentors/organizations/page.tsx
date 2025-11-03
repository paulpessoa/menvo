"use client"

import { useState } from "react"
import { OrganizationFilter } from "@/components/organizations/OrganizationFilter"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function MentorsWithOrganizationFilterPage() {
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <Link
                        href="/mentors"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para mentores
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Mentores por Organização</h1>
                    <p className="text-gray-600">Filtre mentores por organização</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <OrganizationFilter
                        selectedOrganizationId={selectedOrgId}
                        onOrganizationChange={setSelectedOrgId}
                    />
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                    <p className="text-gray-600">
                        {selectedOrgId
                            ? `Mostrando mentores da organização selecionada`
                            : "Selecione uma organização para filtrar mentores"}
                    </p>
                </div>
            </div>
        </div>
    )
}
