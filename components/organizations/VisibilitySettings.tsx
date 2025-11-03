"use client"

import { useEffect, useState } from "react"
import { Loader2, Eye, EyeOff, Info } from "lucide-react"

interface Organization {
    id: string
    name: string
    logo_url?: string
}

interface VisibilitySettingsData {
    visibility_scope: "public" | "exclusive"
    visible_to_organizations: string[]
}

interface VisibilitySettingsProps {
    mentorId?: string
}

export function VisibilitySettings({ mentorId }: VisibilitySettingsProps) {
    const [settings, setSettings] = useState<VisibilitySettingsData | null>(null)
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        fetchData()
    }, [mentorId])

    const fetchData = async () => {
        setLoading(true)
        setError(null)

        try {
            // Fetch current visibility settings
            const visibilityResponse = await fetch("/api/mentors/visibility")
            if (!visibilityResponse.ok) {
                throw new Error("Erro ao carregar configurações de visibilidade")
            }
            const visibilityData = await visibilityResponse.json()
            setSettings(visibilityData)

            // Fetch user's organizations (only if mentor is member)
            const orgsResponse = await fetch("/api/user/organizations")
            if (orgsResponse.ok) {
                const orgsData = await orgsResponse.json()
                // Filter only organizations where user is a mentor
                const mentorOrgs = orgsData.organizations?.filter(
                    (org: any) => org.role === "mentor" && org.status === "active"
                )
                setOrganizations(mentorOrgs || [])
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao carregar dados")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!settings) return

        setSaving(true)
        setError(null)
        setSuccess(false)

        try {
            const response = await fetch("/api/mentors/visibility", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    visibility_scope: settings.visibility_scope,
                    visible_to_organizations:
                        settings.visibility_scope === "exclusive"
                            ? settings.visible_to_organizations
                            : []
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Erro ao salvar configurações")
            }

            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao salvar")
        } finally {
            setSaving(false)
        }
    }

    const toggleOrganization = (orgId: string) => {
        if (!settings) return

        const isSelected = settings.visible_to_organizations.includes(orgId)
        const newOrgs = isSelected
            ? settings.visible_to_organizations.filter((id) => id !== orgId)
            : [...settings.visible_to_organizations, orgId]

        setSettings({
            ...settings,
            visible_to_organizations: newOrgs
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        )
    }

    if (error && !settings) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
            </div>
        )
    }

    if (!settings) return null

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Controle quem pode ver seu perfil</p>
                    <p className="text-blue-700">
                        Configure se você quer ser visível para todos ou apenas para membros de
                        organizações específicas.
                    </p>
                </div>
            </div>

            {/* Visibility Options */}
            <div className="space-y-4">
                {/* Public Option */}
                <div
                    onClick={() => setSettings({ ...settings, visibility_scope: "public" })}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${settings.visibility_scope === "public"
                            ? "border-indigo-600 bg-indigo-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                >
                    <div className="flex items-start gap-3">
                        <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${settings.visibility_scope === "public"
                                    ? "border-indigo-600 bg-indigo-600"
                                    : "border-gray-300"
                                }`}
                        >
                            {settings.visibility_scope === "public" && (
                                <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <Eye className="w-5 h-5 text-gray-700" />
                                <h3 className="font-semibold text-gray-900">Público</h3>
                            </div>
                            <p className="text-sm text-gray-600">
                                Seu perfil será visível para todos os usuários da plataforma. Qualquer pessoa
                                poderá encontrar você e agendar mentorias.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Exclusive Option */}
                <div
                    onClick={() => setSettings({ ...settings, visibility_scope: "exclusive" })}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${settings.visibility_scope === "exclusive"
                            ? "border-indigo-600 bg-indigo-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                >
                    <div className="flex items-start gap-3">
                        <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${settings.visibility_scope === "exclusive"
                                    ? "border-indigo-600 bg-indigo-600"
                                    : "border-gray-300"
                                }`}
                        >
                            {settings.visibility_scope === "exclusive" && (
                                <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <EyeOff className="w-5 h-5 text-gray-700" />
                                <h3 className="font-semibold text-gray-900">Exclusivo</h3>
                            </div>
                            <p className="text-sm text-gray-600">
                                Seu perfil será visível apenas para membros das organizações que você
                                selecionar abaixo. Ideal para mentorias corporativas ou programas fechados.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Organization Selection (only for exclusive) */}
            {settings.visibility_scope === "exclusive" && (
                <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                        Selecione as organizações onde você será visível
                    </h4>

                    {organizations.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p className="mb-2">Você não está associado a nenhuma organização como mentor.</p>
                            <p className="text-sm">
                                Para usar a visibilidade exclusiva, você precisa aceitar convites de
                                organizações.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {organizations.map((org) => (
                                <label
                                    key={org.id}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={settings.visible_to_organizations.includes(org.id)}
                                        onChange={() => toggleOrganization(org.id)}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <div className="flex items-center gap-3 flex-1">
                                        {org.logo_url ? (
                                            <img
                                                src={org.logo_url}
                                                alt={org.name}
                                                className="w-8 h-8 rounded object-cover"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-medium">
                                                {org.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <span className="text-sm font-medium text-gray-900">{org.name}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}

                    {settings.visibility_scope === "exclusive" &&
                        settings.visible_to_organizations.length === 0 &&
                        organizations.length > 0 && (
                            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                                ⚠️ Selecione pelo menos uma organização ou seu perfil não será visível para
                                ninguém.
                            </div>
                        )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    ✓ Configurações salvas com sucesso!
                </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? "Salvando..." : "Salvar Configurações"}
                </button>
            </div>
        </div>
    )
}
