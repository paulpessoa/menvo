"use client"

import { MenvoDots } from "@/components/ui/menvo-loader"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PageContainer } from "@/components/layout/PageContainer"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Edit, ExternalLink } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu"
import { useRouter, useSearchParams } from "next/navigation"
import { UserMetrics } from "@/components/admin/UserMetrics"
import { EditUserModal } from "@/components/admin/EditUserModal"
import { InviteCampaignModal } from "@/components/admin/invites/InviteCampaignModal"
import { toast } from "sonner"
import type { UserProfile } from "@/lib/types/models/user"

interface UserStats {
  all: number
  pending: number
  mentors: number
  mentees: number
  undefined: number
  menvoOrigin: number
  jotformOrigin: number
}

export default function AdminUsersPage() {
  const searchParams = useSearchParams()

  const [users, setUsers] = useState<UserProfile[]>([])
  const [stats, setStats] = useState<UserStats>({
    all: 0,
    pending: 0,
    mentors: 0,
    mentees: 0,
    undefined: 0,
    menvoOrigin: 0,
    jotformOrigin: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const [filters, setFilters] = useState({
    role: "all",
    status: "all",
    origin: "all"
  })
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState("desc")

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [page, setPage] = useState(() => {
    const p = searchParams?.get("page")
    return p ? parseInt(p) : 1
  })
  const ITEMS_PER_PAGE = 30

  // Edit State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        search: searchTerm,
      })
      if (filters.role !== "all") params.append("role", filters.role)
      if (filters.status !== "all") params.append("status", filters.status)
      if (filters.origin !== "all") params.append("origin", filters.origin)
      params.append("sort_by", sortBy)
      params.append("sort_order", sortOrder)

      const response = await fetch(`/api/admin/users?${params.toString()}`)

      if (!response.ok) throw new Error("Erro na API")

      const result = await response.json()
      const newUsers = (result.data.users || []).map((u: any) => ({
        ...u,
        roles: u.user_roles?.map((ur: any) => ur.roles?.name) || []
      }))

      setUsers(newUsers)
      setTotalPages(result.data.pagination.totalPages)
      setTotalItems(result.data.pagination.total)
      setStats(result.data.counts)
      
      // Update URL silently
      window.history.replaceState(null, '', `?${params.toString()}`)
    } catch (error) {
      console.error('Error fetching admin users:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [page, filters, searchTerm, sortBy, sortOrder])

  useEffect(() => {
    fetchData()
  }, [page, filters, sortBy, sortOrder]) // Recarregar ao mudar página ou filtros

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchData()
  }

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user)
    setIsEditModalOpen(true)
  }

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedUserIds.length === users.length && users.length > 0) {
      setSelectedUserIds([])
    } else {
      setSelectedUserIds(users.map(u => u.id))
    }
  }

  return (
    <PageContainer>
      <AdminPageHeader
        title="Usuários"
        description="Busque, edite e gerencie papéis de todos os usuários da plataforma."
      />
      <div className="space-y-8">
        <div className="space-y-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email e pressione Enter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto">
                  Filtros
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>Nível de Permissão</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={filters.role} onValueChange={(v) => { setFilters(f => ({ ...f, role: v })); setPage(1); }}>
                  <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="mentor">Mentores</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="mentee">Mentees</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>

                <DropdownMenuSeparator />

                <DropdownMenuLabel>Status da Conta</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={filters.status} onValueChange={(v) => { setFilters(f => ({ ...f, status: v })); setPage(1); }}>
                  <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="verified">Verificado</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="pending">Pendente (Aguardando)</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>

                <DropdownMenuSeparator />

                <DropdownMenuLabel>Origem (Instituição)</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={filters.origin} onValueChange={(v) => { setFilters(f => ({ ...f, origin: v })); setPage(1); }}>
                  <DropdownMenuRadioItem value="all">Todas as origens</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="menvo">Cadastro direto</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="jotform">Migrado do JotForm</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(v) => {
              const [s, o] = v.split("-")
              setSortBy(s)
              setSortOrder(o)
              setPage(1)
            }}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Mais recentes</SelectItem>
                <SelectItem value="created_at-asc">Mais antigos</SelectItem>
                <SelectItem value="full_name-asc">Nome (A-Z)</SelectItem>
                <SelectItem value="full_name-desc">Nome (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </form>

          <Card>
            <CardContent className="p-0">
              <div className="px-4 py-3 bg-muted/50 border-b flex items-center gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="w-4 flex-shrink-0">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                    checked={selectedUserIds.length > 0 && selectedUserIds.length === users.length}
                    onChange={toggleSelectAll}
                  />
                </div>
                <div className="flex-1">Nome e Email</div>
                <div className="w-32 hidden md:block text-center">Status</div>
                <div className="w-32 hidden md:block text-center">Papel</div>
                <div className="w-20 text-right">Ações</div>
              </div>

              <div className="px-4 py-2 bg-muted/30 border-b flex flex-wrap items-center gap-4">
                {selectedUserIds.length > 0 && (
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-muted-foreground">{selectedUserIds.length} selecionado(s)</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline">
                          Ações em massa
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsInviteModalOpen(true)}>
                          Convidar selecionados
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => toast.error('Ainda não implementado')}>
                          Excluir selecionados
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>

              <div className="divide-y">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <MenvoDots />
                    <p className="text-sm text-muted-foreground">Carregando usuários...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-20">
                    <h3 className="text-lg font-medium">Nenhum resultado</h3>
                  </div>
                ) : (
                  users.map((user) => (
                    <div key={user.id} className={`px-4 py-3 hover:bg-gray-50/50 transition-colors flex items-center gap-4 ${selectedUserIds.includes(user.id) ? 'bg-blue-50/50' : ''}`}>
                      <div className="w-4 flex-shrink-0">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => toggleSelectUser(user.id)}
                        />
                      </div>
                      <Avatar className="h-10 w-10 border shadow-sm flex-shrink-0">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/5 text-primary">{user.full_name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">
                            {user.full_name || 'Sem Nome'}
                          </span>
                          {user.cv_url && (
                            <Badge variant="outline" className="text-[10px] uppercase" title="Possui currículo">
                              CV
                            </Badge>
                          )}
                          {user.origin_platform === "jotform" && (
                            <Badge variant="outline" className="text-[10px] uppercase text-amber-700 border-amber-300 bg-amber-50">
                              JotForm
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                        {(user as any).institution && (
                          <div className="text-[10px] text-muted-foreground mt-1 italic">
                            {(user as any).course} @ {(user as any).institution}
                          </div>
                        )}
                      </div>

                      <div className="w-32 hidden md:flex justify-center flex-shrink-0">
                        {(user.roles.includes('mentor') || user.verification_status === 'pending') && (
                          <Badge variant={user.verified ? "default" : "secondary"} className={user.verified ? "bg-green-600" : "bg-yellow-100 text-yellow-800 border-none"}>
                            {user.verified ? "VERIFICADO" : "PENDENTE"}
                          </Badge>
                        )}
                      </div>

                      <div className="w-32 hidden md:flex justify-center gap-1 flex-shrink-0">
                        {user.roles.map(role => (
                          <Badge key={role} variant="outline" className="text-[10px] uppercase">{role}</Badge>
                        ))}
                      </div>

                      <div className="w-20 flex items-center justify-end flex-shrink-0 gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => {
                          const isMentor = user.roles.includes('mentor');
                          const path = isMentor ? 'mentors' : 'mentee';
                          const identifier = user.slug || user.id;
                          window.open(`/${path}/${identifier}`, '_blank');
                        }} title="Ver Perfil Público">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(user)} title="Editar Usuário">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {!loading && totalPages > 1 && (
                <div className="p-4 border-t flex items-center justify-between bg-gray-50/50">
                  <div className="text-sm text-muted-foreground">
                    Página {page} de {totalPages} ({totalItems} registros)
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                      Anterior
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <EditUserModal
        user={editingUser}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchData}
      />

      <InviteCampaignModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        selectedUserIds={selectedUserIds}
        onSent={() => {
          setSelectedUserIds([])
          fetchData()
        }}
      />
    </PageContainer>
  )
}
