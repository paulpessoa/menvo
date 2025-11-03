"use client"

import { useState } from "react"
import { Mail, Calendar, MoreVertical, Send, XCircle, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Invitation {
    id: string
    user_id: string
    role: "mentor" | "mentee"
    invited_at: string
    expires_at: string
    user: {
        email: string
        full_name?: string
    }
}

interface PendingInvitationsListProps {
    organizationId: string
    invitations: Invitation[]
    onResend?: (invitationId: string) => Promise<void>
    onCancel?: (invitationId: string) => Promise<void>
    onRefresh?: () => void
}

const roleLabels = {
    mentor: "Mentor",
    mentee: "Mentee"
}

export function PendingInvitationsList({
    organizationId,
    invitations,
    onResend,
    onCancel,
    onRefresh
}: PendingInvitationsListProps) {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    const [loadingAction, setLoadingAction] = useState<string | null>(null)

    const formatDate = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), {
                addSuffix: true,
                locale: ptBR
            })
        } catch {
            return dateString
        }
    }

    const handleResend = async (invitationId: string) => {
        if (!onResend) return

        setLoadingAction(`resend-${invitationId}`)
        setOpenMenuId(null)

        try {
            await onResend(invitationId)
            if (onRefresh) onRefresh()
        } catch (error) {
            console.error("Error resending invitation:", error)
        } finally {
            setLoadingAction(null)
        }
    }

    const handleCancel = async (invitationId: string) => {
        if (!onCancel) return

        if (!confirm("Tem certeza que deseja cancelar este convite?")) {
            return
        }

        setLoadingAction(`cancel-${invitationId}`)
        setOpenMenuId(null)

        try {
            await onCancel(invitationId)
            if (onRefresh) onRefresh()
        } catch (error) {
            console.error("Error cancelling invitation:", error)
        } finally {
            setLoadingAction(null)
        }
    }

    if (invitations.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Nenhum convite pendente</p>
            </div>
        )
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Convidado
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Função
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Enviado
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Expira
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {invitations.map((invitation) => {
                            const isLoading = loadingAction?.includes(invitation.id)

                            return (
                                <tr key={invitation.id} className="hover:bg-gray-50">
                                    {/* User Info */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                                <Mail className="w-5 h-5 text-yellow-600" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {invitation.user.full_name || "Sem nome"}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {invitation.user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Role */}
                                    <td className="px-4 py-3">
                                        <span className="text-sm text-gray-900">
                                            {roleLabels[invitation.role]}
                                        </span>
                                    </td>

                                    {/* Invited Date */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                            <Calendar className="w-4 h-4" />
                                            {formatDate(invitation.invited_at)}
                                        </div>
                                    </td>

                                    {/* Expires Date */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                            <Calendar className="w-4 h-4" />
                                            {formatDate(invitation.expires_at)}
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-4 py-3 text-right">
                                        {isLoading ? (
                                            <Loader2 className="w-5 h-5 text-gray-400 animate-spin inline-block" />
                                        ) : (
                                            <div className="relative inline-block">
                                                <button
                                                    onClick={() =>
                                                        setOpenMenuId(
                                                            openMenuId === invitation.id ? null : invitation.id
                                                        )
                                                    }
                                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                >
                                                    <MoreVertical className="w-5 h-5 text-gray-500" />
                                                </button>

                                                {openMenuId === invitation.id && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-10"
                                                            onClick={() => setOpenMenuId(null)}
                                                        />
                                                        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                                                            {onResend && (
                                                                <button
                                                                    onClick={() => handleResend(invitation.id)}
                                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                                >
                                                                    <Send className="w-4 h-4" />
                                                                    Reenviar Convite
                                                                </button>
                                                            )}
                                                            {onCancel && (
                                                                <button
                                                                    onClick={() => handleCancel(invitation.id)}
                                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100"
                                                                >
                                                                    <XCircle className="w-4 h-4" />
                                                                    Cancelar Convite
                                                                </button>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Summary */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
                {invitations.length} convite(s) pendente(s)
            </div>
        </div>
    )
}
