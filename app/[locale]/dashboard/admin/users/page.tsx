"use client"

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
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Loader2,
  RefreshCw,
  Mail,
  MailCheck,
  Calendar,
  Shield,
  Eye,
  MoreVertical,
  Check,
  X,
  AlertTriangle,
  Edit,
  ExternalLink,
  SquareCheck,
  FileText,
  Filter,
  ChevronDown
} from "lucide-react"
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
import { createClient } from "@/lib/utils/supabase/client"
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
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  
  const [filters, setFilters] = useState({
    role: "all",
    status: "all",
    origin: "all"
  })
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState("desc")

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const ITEMS_PER_PAGE = 30
  
  // Edit State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const fetchData = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) {
        setLoadingMore(true)
    } else {
        setLoading(true)
        setPage(1)
    }

    try {
      const currentPage = isLoadMore ? page + 1 : 1
      const params = new URLSearchParams({
        page: currentPage.toString(),
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

      if (isLoadMore) {
        setUsers(prev => [...prev, ...newUsers])
        setPage(currentPage)
      } else {
        setUsers(newUsers)
      }

      setStats(result.data.counts)
      setHasMore(newUsers.length === ITEMS_PER_PAGE)
    } catch (error) {
      console.error('Error fetching admin users:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [page, filters, searchTerm, sortBy, sortOrder])

  useEffect(() => {
    fetchData()
  }, [filters, sortBy, sortOrder]) // Recarregar ao mudar de filtros

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
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
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gestão Global</h1>
            <p className="text-muted-foreground">Controle central de usuários, mentores e permissões</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsInviteModalOpen(true)} size="sm" className="gap-2">
              <Mail className="h-4 w-4" /> Convidar...
            </Button>
            <Button onClick={() => fetchData()} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sincronizar
            </Button>
          </div>
        </div>

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
                <Button variant="outline" className="w-full md:w-auto gap-2">
                  <Filter className="h-4 w-4" /> Filtros Avançados
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>Nível de Permissão</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={filters.role} onValueChange={(v) => setFilters(f => ({ ...f, role: v }))}>
                  <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="mentor">Mentores</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="mentee">Mentees</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel>Status da Conta</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={filters.status} onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}>
                  <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="verified">Verificado</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="pending">Pendente (Aguardando)</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>

                <DropdownMenuSeparator />

                <DropdownMenuLabel>Origem (Instituição)</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={filters.origin} onValueChange={(v) => setFilters(f => ({ ...f, origin: v }))}>
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
                  <div className="w-16 text-right">Ações</div>
                </div>

                <div className="px-4 py-2 bg-muted/30 border-b flex flex-wrap items-center gap-4">
                    {selectedUserIds.length > 0 && (
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-xs text-muted-foreground">{selectedUserIds.length} selecionado(s)</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="gap-2">
                              Ações em Massa <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsInviteModalOpen(true)}>
                              <Mail className="h-4 w-4 mr-2" /> Convidar selecionados
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => toast.error('Ainda não implementado')}>
                              <UserX className="h-4 w-4 mr-2" /> Excluir selecionados
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                </div>

                <div className="divide-y">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Carregando usuários...</p>
                    </div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-20">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
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
                              <div title="Possui currículo">
                                <FileText className="h-3.5 w-3.5 text-blue-500" />
                              </div>
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

                        <div className="w-16 flex items-center justify-end flex-shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                const isMentor = user.roles.includes('mentor');
                                const path = isMentor ? 'mentors' : 'mentee';
                                const identifier = user.slug || user.id;
                                window.open(`/${path}/${identifier}`, '_blank');
                              }}>
                                <ExternalLink className="mr-2 h-4 w-4" /> Perfil Público
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {hasMore && !loading && (
                    <div className="p-4 border-t flex justify-center bg-gray-50/50">
                        <Button variant="outline" onClick={() => fetchData(true)} disabled={loadingMore} className="gap-2">
                            {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            Carregar Mais Usuários
                        </Button>
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
