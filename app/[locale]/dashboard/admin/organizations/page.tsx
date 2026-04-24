"use client"

import { useEffect, useState } from "react"
import {
  Building2,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Filter,
  MoreHorizontal
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Link } from "@/i18n/routing"
import { Organization } from "@/lib/types/organizations"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")

  useEffect(() => {
    fetchOrganizations()
  }, [statusFilter])

  const fetchOrganizations = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append("status", statusFilter)

      const response = await fetch(`/api/admin/organizations?${params}`)
      if (response.ok) {
        const result = await response.json()
        const data = result.data || result
        setOrganizations(data.organizations || [])
      }
    } catch (err) {
      console.error("Error fetching organizations:", err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending_approval: {
        color: "bg-yellow-100 text-yellow-700 border-yellow-200",
        label: "Pendente"
      },
      active: {
        color: "bg-green-100 text-green-700 border-green-200",
        label: "Ativo"
      },
      suspended: {
        color: "bg-red-100 text-red-700 border-red-200",
        label: "Suspenso"
      },
      inactive: {
        color: "bg-gray-100 text-gray-700 border-gray-200",
        label: "Inativo"
      }
    }
    const badge = badges[status as keyof typeof badges] || badges.inactive
    return (
      <Badge variant="outline" className={`font-medium ${badge.color}`}>
        {badge.label}
      </Badge>
    )
  }

  const filteredOrgs = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gerenciar Organizações
          </h1>
          <p className="text-muted-foreground">
            Visualize e gerencie todas as instituições parceiras da Menvo.
          </p>
        </div>
        <Button asChild>
          <Link href="/organizations/new">Criar Nova Organização</Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            title="remova este titulo"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos os status</option>
            <option value="pending_approval">Pendentes</option>
            <option value="active">Ativas</option>
            <option value="suspended">Suspensas</option>
            <option value="inactive">Inativas</option>
          </select>
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Carregando organizações...</p>
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="py-20 text-center">
            <Building2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium">
              Nenhuma organização encontrada
            </h3>
            <p className="text-muted-foreground">
              Tente ajustar seus filtros ou busca.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">
                    Organização
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">
                    Membros
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrgs.map((org) => (
                  <tr
                    key={org.id}
                    className="hover:bg-muted/10 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {org.logo_url ? (
                          <img
                            src={org.logo_url}
                            alt={org.name}
                            className="w-10 h-10 rounded-lg object-contain bg-white border p-1"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-sm text-foreground">
                            {org.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {org.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="font-normal">
                        {org.memberCount || 0} usuários
                      </Badge>
                    </td>
                    <td className="px-6 py-4 capitalize text-sm">{org.type}</td>
                    <td className="px-6 py-4">{getStatusBadge(org.status)}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(org.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/admin/organizations/${org.id}`}
                            >
                              Ver detalhes
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/organizations/${org.slug}/dashboard/members`}
                            >
                              Gerenciar membros
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Suspender
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
