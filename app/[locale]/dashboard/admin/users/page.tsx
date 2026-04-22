"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb"
import { UserMetrics } from "@/components/admin/UserMetrics"
import { EditUserModal } from "@/components/admin/EditUserModal"
import { createClient } from "@/lib/utils/supabase/client"
import { toast } from "sonner"
import type { UserProfile } from "@/lib/types/models/user"

interface UserStats {
  total: number
  mentors: number
  mentees: number
  admins: number
  verified: number
  pending: number
}

export default function AdminUsersPage() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || 'all'
  
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    mentors: 0,
    mentees: 0,
    admins: 0,
    verified: 0,
    pending: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState(initialTab)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [inviting, setInviting] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const ITEMS_PER_PAGE = 30
  
  // Edit State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const supabase = createClient()

  const fetchData = useCallback(async (isLoadMore = false) => {
    if (!supabase) return
    
    if (!isLoadMore) {
        setLoading(true)
        setPage(1)
    }

    try {
      const from = isLoadMore ? page * ITEMS_PER_PAGE : 0
      const to = from + ITEMS_PER_PAGE - 1

      const { data: userDataRaw, error: userError, count } = await (supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          full_name,
          avatar_url,
          verified,
          verification_notes,
          bio,
          created_at,
          slug,
          cv_url,
          invite_sent_at,
          institution,
          course,
          user_roles (
            roles (
              name
            )
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to) as any)

      if (userError) throw userError

      const newUserData = ((userDataRaw as any[]) || []).map(user => ({
        ...user,
        roles: (user.user_roles as any)?.map((ur: any) => ur.roles?.name).filter(Boolean) || []
      }))

      if (isLoadMore) {
        setUsers(prev => [...prev, ...newUserData])
        setPage(prev => prev + 1)
      } else {
        setUsers(newUserData)
      }

      setHasMore(newUserData.length === ITEMS_PER_PAGE)

      if (!isLoadMore) {
        const total = count || 0
        setStats(prev => ({ ...prev, total }))
      }
    } catch (error) {
      console.error('Error fetching admin users:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [supabase, page])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, activeTab])

  const filterUsers = () => {
    let filtered = users

    switch (activeTab) {
      case 'mentors':
        filtered = filtered.filter(u => u.roles.includes('mentor'))
        break
      case 'pending':
        filtered = filtered.filter(u => u.roles.includes('mentor') && !u.verified)
        break
      case 'mentees':
        filtered = filtered.filter(u => u.roles.includes('mentee'))
        break
      case 'admins':
        filtered = filtered.filter(u => u.roles.includes('admin'))
        break
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(user =>
        user.full_name?.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      )
    }

    setFilteredUsers(filtered)
  }

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user)
    setIsEditModalOpen(true)
  }

  const handleBatchInvite = async () => {
    if (selectedUserIds.length === 0) return
    if (!confirm(`Deseja enviar convites de acesso para os ${selectedUserIds.length} usuários selecionados?`)) return
    
    setInviting(true)
    try {
      const response = await fetch('/api/admin/users/invite-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUserIds })
      })
      
      const result = await response.json()
      if (response.ok) {
        toast.success(result.message)
        setSelectedUserIds([])
        fetchData()
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      toast.error('Erro no envio em massa: ' + error.message)
    } finally {
      setInviting(false)
    }
  }

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0) {
      setSelectedUserIds([])
    } else {
      setSelectedUserIds(filteredUsers.map(u => u.id))
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <AdminBreadcrumb />
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gestão Global</h1>
            <p className="text-muted-foreground">Controle central de usuários, mentores e permissões</p>
          </div>
          <div className="flex gap-2">
            {selectedUserIds.length > 0 && (
              <Button onClick={handleBatchInvite} disabled={inviting} className="bg-blue-600 hover:bg-blue-700">
                {inviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                Convidar ({selectedUserIds.length})
              </Button>
            )}
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" /> Sincronizar
            </Button>
          </div>
        </div>

        <UserMetrics data={users} />

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="px-4 pt-4 border-b overflow-x-auto">
                  <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-6">
                    <TabsTrigger value="all" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2 bg-transparent">
                        Todos <Badge variant="secondary" className="ml-2">{stats.total}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2 bg-transparent">
                        Aguardando <Badge className="ml-2 bg-yellow-500">{stats.pending}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="mentors" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2 bg-transparent">
                        Mentores <Badge variant="outline" className="ml-2">{stats.mentors}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="mentees" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2 bg-transparent">
                        Mentees <Badge variant="outline" className="ml-2">{stats.mentees}</Badge>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="px-4 py-2 bg-muted/30 border-b flex items-center gap-4">
                    <input 
                      type="checkbox" 
                      className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                      checked={selectedUserIds.length > 0 && selectedUserIds.length === filteredUsers.length}
                      onChange={toggleSelectAll}
                    />
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Selecionar Todos ({filteredUsers.length})</span>
                </div>

                <div className="divide-y">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Carregando usuários...</p>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-20">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                      <h3 className="text-lg font-medium">Nenhum resultado</h3>
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
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
                              <FileText className="h-3.5 w-3.5 text-blue-500" title="Possui currículo" />
                            )}
                            {user.roles.includes('mentor') && (
                                <Badge variant={user.verified ? "default" : "secondary"} className={user.verified ? "bg-green-600" : "bg-yellow-100 text-yellow-800"}>
                                    {user.verified ? "VERIFICADO" : "PENDENTE"}
                                </Badge>
                            )}
                            {(user as any).invite_sent_at && (
                              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                                <MailCheck className="h-3 w-3 mr-1" /> CONVIDADO
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
                        <Button variant="outline" onClick={() => fetchData(true)} className="gap-2">
                            <RefreshCw className="h-4 w-4" /> Carregar Mais Usuários
                        </Button>
                    </div>
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
    </div>
  )
}
