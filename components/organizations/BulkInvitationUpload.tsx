"use client"

import { useState } from "react"
import { Upload, Download, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface BulkInvitationUploadProps {
    organizationId: string
    onSuccess?: () => void
}

interface BulkResult {
    success_count: number
    failed_count: number
    results: Array<{
        email: string
        role: string
        success: boolean
        error?: string
    }>
}

export function BulkInvitationUpload({
    organizationId,
    onSuccess
}: BulkInvitationUploadProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [result, setResult] = useState<BulkResult | null>(null)
    const [file, setFile] = useState<File | null>(null)

    const downloadTemplate = () => {
        const csvContent = "email,role\nmentor@exemplo.com,mentor\nmentee@exemplo.com,mentee"
        const blob = new Blob([csvContent], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "template-convites.csv"
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        if (!selectedFile.name.endsWith(".csv")) {
            setError("Por favor, selecione um arquivo CSV")
            return
        }

        if (selectedFile.size > 1024 * 1024) {
            // 1MB
            setError("Arquivo muito grande. Máximo 1MB")
            return
        }

        setFile(selectedFile)
        setError(null)
        setResult(null)
    }

    const parseCSV = async (file: File): Promise<Array<{ email: string; role: string }>> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()

            reader.onload = (e) => {
                try {
                    const text = e.target?.result as string
                    const lines = text.split("\n").filter((line) => line.trim())

                    if (lines.length < 2) {
                        reject(new Error("Arquivo CSV vazio ou inválido"))
                        return
                    }

                    const header = lines[0].toLowerCase().split(",").map((h) => h.trim())
                    if (!header.includes("email") || !header.includes("role")) {
                        reject(new Error("CSV deve conter colunas 'email' e 'role'"))
                        return
                    }

                    const emailIndex = header.indexOf("email")
                    const roleIndex = header.indexOf("role")

                    const invitations = lines
                        .slice(1)
                        .map((line) => {
                            const values = line.split(",").map((v) => v.trim())
                            return {
                                email: values[emailIndex],
                                role: values[roleIndex]
                            }
                        })
                        .filter((inv) => inv.email && inv.role)

                    if (invitations.length === 0) {
                        reject(new Error("Nenhum convite válido encontrado no CSV"))
                        return
                    }

                    if (invitations.length > 100) {
                        reject(new Error("Máximo de 100 convites por arquivo"))
                        return
                    }

                    resolve(invitations)
                } catch (err) {
                    reject(new Error("Erro ao processar CSV"))
                }
            }

            reader.onerror = () => reject(new Error("Erro ao ler arquivo"))
            reader.readAsText(file)
        })
    }

    const handleUpload = async () => {
        if (!file) return

        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const invitations = await parseCSV(file)

            const response = await fetch(
                `/api/organizations/${organizationId}/members/bulk-invite`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ invitations })
                }
            )

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Erro ao enviar convites")
            }

            setResult(data)
            setFile(null)

            if (onSuccess && data.success_count > 0) {
                setTimeout(() => onSuccess(), 2000)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao processar arquivo")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Como usar:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Baixe o template CSV</li>
                    <li>Preencha com os emails e funções (mentor ou mentee)</li>
                    <li>Faça upload do arquivo preenchido</li>
                    <li>Revise o resumo e confirme o envio</li>
                </ol>
            </div>

            {/* Download Template */}
            <button
                type="button"
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
            >
                <Download className="w-4 h-4" />
                Baixar Template CSV
            </button>

            {/* File Upload */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload do Arquivo CSV
                </label>
                <div className="flex items-center gap-3">
                    <label className="flex-1 flex items-center justify-center px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors">
                        <div className="text-center">
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <span className="block text-sm text-gray-600">
                                {file ? file.name : "Clique para selecionar arquivo CSV"}
                            </span>
                            <span className="block text-xs text-gray-500 mt-1">
                                Máximo 100 convites por arquivo
                            </span>
                        </div>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={loading}
                        />
                    </label>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Upload Button */}
            {file && !result && (
                <button
                    onClick={handleUpload}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? "Enviando convites..." : "Enviar Convites"}
                </button>
            )}

            {/* Results */}
            {result && (
                <div className="space-y-4">
                    {/* Summary */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-green-700">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">Sucesso</span>
                            </div>
                            <div className="text-2xl font-bold text-green-900 mt-1">
                                {result.success_count}
                            </div>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-red-700">
                                <XCircle className="w-5 h-5" />
                                <span className="font-medium">Falhas</span>
                            </div>
                            <div className="text-2xl font-bold text-red-900 mt-1">
                                {result.failed_count}
                            </div>
                        </div>
                    </div>

                    {/* Detailed Results */}
                    {result.failed_count > 0 && (
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-yellow-600" />
                                Detalhes dos Erros
                            </h4>
                            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-60 overflow-y-auto">
                                {result.results
                                    .filter((r) => !r.success)
                                    .map((r, index) => (
                                        <div key={index} className="px-4 py-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900">{r.email}</div>
                                                    <div className="text-sm text-gray-600">{r.role}</div>
                                                </div>
                                                <div className="text-sm text-red-600">{r.error}</div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Success Message */}
                    {result.success_count > 0 && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                            {result.success_count} convite(s) enviado(s) com sucesso! Os membros receberão
                            emails.
                        </div>
                    )}

                    {/* Reset Button */}
                    <button
                        onClick={() => {
                            setResult(null)
                            setFile(null)
                        }}
                        className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Enviar Mais Convites
                    </button>
                </div>
            )}
        </div>
    )
}
