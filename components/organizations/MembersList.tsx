"use client"

import { useState } from "react"
import { User, Mail, Calendar, MoreVertical, Trash2, Edit, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Member {
    id: string
    user_id: string
    role: "admin" | "mentor" | "mentee"
    status: "active" | "invited" | "expired" | "left"
    joined_at?: string
    invited_at?: string
    expires_at?: string
    user: {
        id: string
        email: string
        full_name?: string
        avatar_url?: string
    }
}

interface MembersListProps {
    organizationId: string
    members: Member[]
    onRemove?: (memberId: string) => void
    onEdit?: (memberId: string) => void
    onExtend?: (memberId: string) => void
}

const roleLabels = {
    admin: "Administrador",
    mentor: "Mentor",
    mentee: "Mentee"
}

const statusLabels = {
    active: "Ativo",
    invited: "Convidado",
    expired: "Expirado",
    left: "Saiu"
}

const statusColors = {
    active: "bg-green-100 text-green-800",
    invited: "bg-yellow-100 text-yellow-800",
    expired: "bg-red-100 text-red-800",
    left: "bg-gray-100 text-gray-800"
}

export function MembersList({
    organizationId,
    members,
    onRemove,
    onEdit,
    onExtend
}: MembersListProps) {
    const [filter, setFilter] = useState<{
        role?: string
        status?: string
        search?: string
    }>({})
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)

    // Filter members
    const filteredMembers = members.filter((member) => {
        if (filter.role && member.role !== filter.role) return false
        if (filter.status && member.status !== filter.status) return false
        if (filter.search) {
            const search = filter.search.toLowerCase()
            const name = member.user.full_name?.toLowerCase() || ""
            const email = member.user.email.toLowerCase()
            if (!name.includes(search) && !email.includes(search)) return false
        }
        return true
    })

    const formatDate = (dateString?: string) => {
        if (!dateString) return "-"
        try {
            return formatDistanceToNow(new Date(dateString), {
                addSuffix: true,
                locale: ptBR
            })
        } catch {
            return dateString
        }
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    value={filter.search || ""}
                    onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                    className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />

                <select
                    value={filter.role || ""}
                    onChange={(e) =>
                        setFilter({ ...filter, role: e.target.value || undefined })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                    <option value="">Todas as funções</option>
                    <option value="admin">Administrador</option>
                    <option value="mentor">Mentor</option>
                    <option value="mentee">Mentee</option>
                </select>

                <select
                    value={filter.status || ""}
                    onChange={(e) =>
                        setFilter({ ...filter, status: e.target.value || undefined })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                    <option value="">Todos os status</option>
                    <option value="active">Ativo</option>
                    <option value="invited">Convidado</option>
                    <option value="expired">Expirado</option>
                    <option value="left">Saiu</option>
                </select>
            </div>

            {/* Members Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Membro
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Função
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Data de Entrada
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Expira em
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredMembers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        Nenhum membro encontrado
                                    </td>
                                </tr>
                            ) : (
                                filteredMembers.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50">
                                        {/* Member Info */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {member.user.avatar_url ? (
                                                    <img
                                                        src={member.user.avatar_url}
                                                        alt={member.user.full_name || member.user.email}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                        <User className="w-5 h-5 text-indigo-600" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {member.user.full_name || "Sem nome"}
                                                    </div>
                                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {member.user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Role */}
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-gray-900">
                                                {roleLabels[member.role]}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[member.status]
                                                    }`}
                                            >
                                                {statusLabels[member.status]}
                                            </span>
                                        </td>

                                        {/* Joined Date */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                                <Calendar className="w-4 h-4" />
                                                {formatDate(member.joined_at || member.invited_at)}
                                            </div>
                                        </td>

                                        {/* Expires At */}
                                        <td className="px-4 py-3">
                                            {member.expires_at ? (
                                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                                    <Clock className="w-4 h-4" />
                                                    {formatDate(member.expires_at)}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">-</span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3 text-right">
                                            <div className="relative inline-block">
                                                <button
                                                    onClick={() =>
                                                        setOpenMenuId(
                                                            openMenuId === member.id ? null : member.id
                                                        )
                                                    }
                                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                >
                                                    <MoreVertical className="w-5 h-5 text-gray-500" />
                                                </button>

                                                {openMenuId === member.id && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-10"
                                                            onClick={() => setOpenMenuId(null)}
                                                        />
                                                        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                                                            {onEdit && (
                                                                <button
                                                                    onClick={() => {
                                                                        onEdit(member.id)
                                                                        setOpenMenuId(null)
                                                                    }}
                                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                    Editar
                                                                </button>
                                                            )}
                                                            {onExtend && member.expires_at && (
                                                                <button
                                                                    onClick={() => {
                                                                        onExtend(member.id)
                                                                        setOpenMenuId(null)
                                                                    }}
                                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                                >
                                                                    <Clock className="w-4 h-4" />
                                                                    Estender Expiração
                                                                </button>
                                                            )}
                                                            {onRemove && member.status === "active" && (
                                                                <button
                                                                    onClick={() => {
                                                                        if (
                                                                            confirm(
                                                                                "Tem certeza que deseja remover este membro?"
                                                                            )
                                                                        ) {
                                                                            onRemove(member.id)
                                                                        }
                                                                        setOpenMenuId(null)
                                                                    }}
                                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                    Remover
                                                                </button>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary */}
            <div className="text-sm text-gray-600">
                Mostrando {filteredMembers.length} de {members.length} membros
            </div>
        </div>
    )
}
