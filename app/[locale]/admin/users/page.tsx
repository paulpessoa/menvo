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
  Calendar,
  Shield,
  Eye,
  MoreVertical,
  Check,
  X,
  AlertTriangle,
  Edit,
  ExternalLink
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
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"

interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  avatar_url: string | null
  verified: boolean
  verification_notes: string | null
  bio: string | null
  created_at: string
  roles: string[]
}

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
  
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
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
  
  // Edit State
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    try {
      const { data: userDataRaw, error: userError } = await supabase
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
          user_roles (
            roles (
              name
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (userError) throw userError

      const userData = (userDataRaw || []).map(user => ({
        ...user,
        roles: (user.user_roles as any)?.map((ur: any) => ur.roles?.name).filter(Boolean) || []
      }))

      setUsers(userData)

      const total = userData.length
      const mentors = userData.filter(u => u.roles.includes('mentor')).length
      const mentees = userData.filter(u => u.roles.includes('mentee')).length
      const admins = userData.filter(u => u.roles.includes('admin')).length
      const verified = userData.filter(u => u.verified).length
      const pending = userData.filter(u => u.roles.includes('mentor') && !u.verified).length

      setStats({ total, mentors, mentees, admins, verified, pending })
    } catch (error) {
      console.error('Error fetching admin users:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setIsEditModalOpen(true)
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
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" /> Sincronizar
          </Button>
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
                      <div key={user.id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center gap-4">
                        <Avatar className="h-12 w-12 border shadow-sm">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/5 text-primary">{user.full_name?.[0] || 'U'}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm truncate">
                              {user.full_name || 'Sem Nome'}
                            </span>
                            {user.roles.includes('mentor') && (
                                <Badge variant={user.verified ? "default" : "secondary"} className={user.verified ? "bg-green-600" : "bg-yellow-100 text-yellow-800"}>
                                    {user.verified ? "VERIFICADO" : "PENDENTE"}
                                </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
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
                              <DropdownMenuItem onClick={() => window.open(`/mentors/${user.id}`, '_blank')}>
                                <ExternalLink className="mr-2 h-4 w-4" /> Perfil Público
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))
                  )}
                </div>
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
