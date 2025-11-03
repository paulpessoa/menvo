"use client"

import { useState } from "react"
import { Loader2, Mail, AlertCircle } from "lucide-react"

interface InvitationFormProps {
    organizationId: string
    currentQuota?: {
        mentors: { current: number; max: number }
        mentees: { current: number; max: number }
    }
    onSuccess?: () => void
}

export function InvitationForm({
    organizationId,
    currentQuota,
    onSuccess
}: InvitationFormProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState({
        email: "",
        role: "mentee" as "mentor" | "mentee",
        expires_at: ""
    })

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        setError(null)
    }

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    const checkQuota = (): boolean => {
        if (!currentQuota) return true

        const quota =
            formData.role === "mentor" ? currentQuota.mentors : currentQuota.mentees

        if (quota.current >= quota.max) {
            setError(
                `Limite de ${formData.role === "mentor" ? "mentores" : "mentees"} atingido (${quota.current}/${quota.max})`
            )
            return false
        }

        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateEmail(formData.email)) {
            setError("Email inválido")
            return
        }

        if (!checkQuota()) {
            return
        }

        setLoading(true)
        setError(null)
        setSuccess(false)

        try {
            const payload: any = {
                email: formData.email,
                role: formData.role
            }

            if (formData.expires_at) {
                payload.expires_at = new Date(formData.expires_at).toISOString()
            }

            const response = await fetch(
                `/api/organizations/${organizationId}/members`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                }
            )

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Erro ao enviar convite")
            }

            setSuccess(true)
            setFormData({ email: "", role: "mentee", expires_at: "" })

            if (onSuccess) {
                setTimeout(() => onSuccess(), 1500)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao enviar convite")
        } finally {
            setLoading(false)
        }
    }

    const getQuotaWarning = () => {
        if (!currentQuota) return null

        const quota =
            formData.role === "mentor" ? currentQuota.mentors : currentQuota.mentees
        const percentage = (quota.current / quota.max) * 100

        if (percentage >= 90) {
            return (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <strong>Atenção:</strong> Você está próximo do limite de{" "}
                        {formData.role === "mentor" ? "mentores" : "mentees"} ({quota.current}
                        /{quota.max})
                    </div>
                </div>
            )
        }

        return null
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    Convite enviado com sucesso! O membro receberá um email.
                </div>
            )}

            {getQuotaWarning()}

            {/* Email */}
            <div>
                <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                >
                    Email *
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="usuario@exemplo.com"
                    />
                </div>
            </div>

            {/* Role */}
            <div>
                <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-700 mb-1"
                >
                    Função *
                </label>
                <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                    <option value="mentee">Mentee</option>
                    <option value="mentor">Mentor</option>
                </select>
                {currentQuota && (
                    <p className="mt-1 text-xs text-gray-500">
                        {formData.role === "mentor"
                            ? `Mentores: ${currentQuota.mentors.current}/${currentQuota.mentors.max}`
                            : `Mentees: ${currentQuota.mentees.current}/${currentQuota.mentees.max}`}
                    </p>
                )}
            </div>

            {/* Expiration Date */}
            <div>
                <label
                    htmlFor="expires_at"
                    className="block text-sm font-medium text-gray-700 mb-1"
                >
                    Data de Expiração (opcional)
                </label>
                <input
                    type="date"
                    id="expires_at"
                    name="expires_at"
                    value={formData.expires_at}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                    Deixe em branco para membership sem expiração
                </p>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Enviar Convite
            </button>
        </form>
    )
}
