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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  FileText
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter, useSearchParams } from "next/navigation"
import { UserMetrics } from "@/components/admin/UserMetrics"
import { EditUserModal } from "@/components/admin/EditUserModal"
import { WaitingListTab } from "@/components/admin/WaitingListTab"
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
  waitingList: number
}

export default function AdminUsersPage() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || 'all'
  
  const [users, setUsers] = useState<UserProfile[]>([])
  const [stats, setStats] = useState<UserStats>({
    all: 0,
    pending: 0,
    mentors: 0,
    mentees: 0,
    undefined: 0,
    menvoOrigin: 0,
    jotformOrigin: 0,
    waitingList: 0
  })
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState(initialTab)
  const [originFilter, setOriginFilter] = useState<"all" | "menvo" | "jotform">("all")
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [sendingInvites, setSendingInvites] = useState(false)
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
      const originParam = originFilter !== "all" ? `&origin=${originFilter}` : ""
      const response = await fetch(`/api/admin/users?page=${currentPage}&limit=${ITEMS_PER_PAGE}&tab=${activeTab}&search=${searchTerm}${originParam}`)
      
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
  }, [page, activeTab, searchTerm, originFilter])

  useEffect(() => {
    // Sempre busca (mesmo na aba "waiting-list", que usa seu próprio
    // componente pra listar) — é o que traz os `counts` usados nos badges
    // de todas as abas, incluindo o da Waiting List.
    fetchData()
  }, [activeTab, originFilter]) // Recarregar ao mudar de aba ou origem

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

  // Único uso hoje da seleção em massa: reenviar o e-mail de convite/definição
  // de senha (POST /api/admin/users/invite-batch) para quem ainda não entrou
  // na plataforma. A rota já existia, mas nada na UI a chamava — marcar as
  // linhas não tinha nenhum efeito visível.
  const handleBulkInvite = async () => {
    if (selectedUserIds.length === 0) return
    setSendingInvites(true)
    try {
      const response = await fetch("/api/admin/users/invite-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedUserIds })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Erro ao enviar convites")
      toast.success(data.message || "Convites enviados")
      setSelectedUserIds([])
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar convites")
    } finally {
      setSendingInvites(false)
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
            <Select value={originFilter} onValueChange={(v) => setOriginFilter(v as typeof originFilter)}>
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="Origem do cadastro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as origens</SelectItem>
                <SelectItem value="menvo">Cadastro direto ({stats.menvoOrigin})</SelectItem>
                <SelectItem value="jotform">Migrado do JotForm ({stats.jotformOrigin})</SelectItem>
              </SelectContent>
            </Select>
          </form>

          <Card>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
                <div className="px-4 pt-4 border-b overflow-x-auto">
                  <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-6">
                    <TabsTrigger value="all" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2 bg-transparent">
                        Todos <Badge variant="secondary" className="ml-2">{stats.all}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2 bg-transparent">
                        Aguardando <Badge className="ml-2 bg-yellow-500 hover:bg-yellow-600 text-white">{stats.pending}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="mentors" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2 bg-transparent">
                        Mentores <Badge variant="outline" className="ml-2">{stats.mentors}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="mentees" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2 bg-transparent">
                        Mentees <Badge variant="outline" className="ml-2">{stats.mentees}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="undefined" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2 bg-transparent">
                        Não Definidos <Badge variant="destructive" className="ml-2">{stats.undefined}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="waiting-list" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2 bg-transparent">
                        Waiting List <Badge variant="outline" className="ml-2 text-purple-700 border-purple-300 bg-purple-50">{stats.waitingList}</Badge>
                    </TabsTrigger>
                  </TabsList>
                </div>

                {activeTab === "waiting-list" ? (
                  <WaitingListTab />
                ) : (
                <>
                <div className="px-4 py-2 bg-muted/30 border-b flex flex-wrap items-center gap-4">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                      checked={selectedUserIds.length > 0 && selectedUserIds.length === users.length}
                      onChange={toggleSelectAll}
                    />
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Selecionar Todos ({users.length})</span>
                    {selectedUserIds.length > 0 && (
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-xs text-muted-foreground">{selectedUserIds.length} selecionado(s)</span>
                        <Button size="sm" variant="outline" onClick={handleBulkInvite} disabled={sendingInvites} className="gap-2">
                          {sendingInvites ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                          Reenviar convite de acesso
                        </Button>
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
                      <div key={user.id} className={`p-4 hover:bg-gray-50/50 transition-colors flex items-center gap-4 ${selectedUserIds.includes(user.id) ? 'bg-blue-50/50' : ''}`}>
                        <input 
                          type="checkbox" 
                          className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => toggleSelectUser(user.id)}
                        />
                        <Avatar className="h-12 w-12 border shadow-sm">
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
                            {(user.roles.includes('mentor') || user.verification_status === 'pending') && (
                                <Badge variant={user.verified ? "default" : "secondary"} className={user.verified ? "bg-green-600" : "bg-yellow-100 text-yellow-800 border-none"}>
                                    {user.verified ? "VERIFICADO" : "PENDENTE"}
                                </Badge>
                            )}
                            {user.origin_platform === "jotform" && (
                              <Badge variant="outline" className="text-[10px] uppercase text-amber-700 border-amber-300 bg-amber-50">
                                JotForm
                              </Badge>
                            )}
                            {user.in_waiting_list && (
                              <Badge variant="outline" className="text-[10px] uppercase text-purple-700 border-purple-300 bg-purple-50">
                                Waiting List
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

                        <div className="hidden md:flex gap-1">
                          {user.roles.map(role => (
                            <Badge key={role} variant="outline" className="text-[10px] uppercase">{role}</Badge>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                            <Edit className="h-4 w-4 mr-2" /> Editar
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
                </>
                )}
              </Tabs>
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
    </PageContainer>
  )
}
