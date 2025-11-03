"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, Loader2 } from "lucide-react"

interface OrganizationFormData {
    name: string
    type: "school" | "company" | "nonprofit" | "community"
    description: string
    logo_url?: string
    website?: string
    contact_email?: string
    contact_phone?: string
}

interface OrganizationFormProps {
    initialData?: Partial<OrganizationFormData>
    organizationId?: string
    onSuccess?: () => void
}

export function OrganizationForm({
    initialData,
    organizationId,
    onSuccess
}: OrganizationFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [uploadingLogo, setUploadingLogo] = useState(false)

    const [formData, setFormData] = useState<OrganizationFormData>({
        name: initialData?.name || "",
        type: initialData?.type || "company",
        description: initialData?.description || "",
        logo_url: initialData?.logo_url || "",
        website: initialData?.website || "",
        contact_email: initialData?.contact_email || "",
        contact_phone: initialData?.contact_phone || ""
    })

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        setError(null)
    }

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file
        if (!file.type.startsWith("image/")) {
            setError("Por favor, selecione uma imagem válida")
            return
        }

        if (file.size > 2 * 1024 * 1024) {
            setError("A imagem deve ter no máximo 2MB")
            return
        }

        setUploadingLogo(true)
        setError(null)

        try {
            // TODO: Implement actual upload to Supabase Storage
            // For now, create a temporary URL
            const tempUrl = URL.createObjectURL(file)
            setFormData(prev => ({ ...prev, logo_url: tempUrl }))
        } catch (err) {
            setError("Erro ao fazer upload da logo")
            console.error(err)
        } finally {
            setUploadingLogo(false)
        }
    }

    const validateForm = (): boolean => {
        if (!formData.name.trim()) {
            setError("Nome da organização é obrigatório")
            return false
        }

        if (!formData.description.trim()) {
            setError("Descrição é obrigatória")
            return false
        }

        if (formData.description.length > 500) {
            setError("Descrição deve ter no máximo 500 caracteres")
            return false
        }

        if (formData.contact_email && !formData.contact_email.includes("@")) {
            setError("Email de contato inválido")
            return false
        }

        if (formData.website && !formData.website.startsWith("http")) {
            setError("Website deve começar com http:// ou https://")
            return false
        }

        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        setLoading(true)
        setError(null)

        try {
            const url = organizationId
                ? `/api/organizations/${organizationId}`
                : "/api/organizations"

            const method = organizationId ? "PATCH" : "POST"

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Erro ao salvar organização")
            }

            if (onSuccess) {
                onSuccess()
            } else {
                router.push(`/organizations/${data.organization.slug}`)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao salvar organização")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Nome */}
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Organização *
                </label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ex: Universidade Federal de Pernambuco"
                />
            </div>

            {/* Tipo */}
            <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Organização *
                </label>
                <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                    <option value="school">Escola/Universidade</option>
                    <option value="company">Empresa</option>
                    <option value="nonprofit">ONG/Sem fins lucrativos</option>
                    <option value="community">Comunidade</option>
                </select>
            </div>

            {/* Descrição */}
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição *
                </label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    maxLength={500}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Descreva sua organização e seus objetivos..."
                />
                <p className="mt-1 text-sm text-gray-500">
                    {formData.description.length}/500 caracteres
                </p>
            </div>

            {/* Logo */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo (opcional)
                </label>
                <div className="flex items-start gap-4">
                    {formData.logo_url && (
                        <img
                            src={formData.logo_url}
                            alt="Logo preview"
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        />
                    )}
                    <div className="flex-1">
                        <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors">
                            <div className="text-center">
                                {uploadingLogo ? (
                                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto" />
                                ) : (
                                    <Upload className="w-6 h-6 text-gray-400 mx-auto" />
                                )}
                                <span className="mt-2 block text-sm text-gray-600">
                                    {uploadingLogo ? "Enviando..." : "Clique para fazer upload"}
                                </span>
                                <span className="mt-1 block text-xs text-gray-500">
                                    PNG, JPG até 2MB
                                </span>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                                disabled={uploadingLogo}
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* Website */}
            <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                    Website (opcional)
                </label>
                <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="https://exemplo.com"
                />
            </div>

            {/* Email de Contato */}
            <div>
                <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email de Contato (opcional)
                </label>
                <input
                    type="email"
                    id="contact_email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="contato@exemplo.com"
                />
            </div>

            {/* Telefone */}
            <div>
                <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone (opcional)
                </label>
                <input
                    type="tel"
                    id="contact_phone"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="+55 (81) 99999-9999"
                />
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={loading}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading || uploadingLogo}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {organizationId ? "Salvar Alterações" : "Criar Organização"}
                </button>
            </div>

            {!organizationId && (
                <p className="text-sm text-gray-500 text-center">
                    Sua organização será revisada pela nossa equipe antes de ser aprovada.
                </p>
            )}
        </form>
    )
}
