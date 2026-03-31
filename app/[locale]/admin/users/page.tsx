"use client"

import { useState, useEffect } from "react"
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
  X
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RequireRole } from "@/lib/auth/auth-guard"
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb"
import { UserMetrics } from "@/components/admin/UserMetrics"
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
  created_at: string
  roles: string[]
}

interface UserStats {
  total: number
  mentors: number
  mentees: number
  admins: number
  verified: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    mentors: 0,
    mentees: 0,
    admins: 0,
    verified: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch users
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
          created_at,
          user_roles (
            roles (
              name
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (userError) throw userError

      // Fetch appointments for metrics
      const { data: appData, error: appError } = await supabase
        .from('appointments')
        .select('created_at')
        .order('created_at', { ascending: true })

      if (appError) console.error('Error fetching appointments for metrics:', appError)

      const userData = (userDataRaw || []).map(user => ({
        ...user,
        roles: user.user_roles?.map((ur: any) => ur.roles?.name).filter(Boolean) || []
      }))

      setUsers(userData)
      setAppointments(appData || [])

      const total = userData.length
      const mentors = userData.filter(u => u.roles.includes('mentor')).length
      const mentees = userData.filter(u => u.roles.includes('mentee')).length
      const admins = userData.filter(u => u.roles.includes('admin')).length
      const verified = userData.filter(u => u.verified).length

      setStats({ total, mentors, mentees, admins, verified })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Erro ao carregar dados do painel')
    } finally {
      setLoading(false)
    }
  }

  const toggleVerification = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verified: !currentStatus })
        .eq('id', userId)

      if (error) throw error

      toast.success(currentStatus ? 'Mentor desverificado' : 'Mentor verificado com sucesso')
      fetchData()
    } catch (error) {
      console.error('Error updating verification:', error)
      toast.error('Erro ao atualizar verificação')
    } finally {
      setActionLoading(null)
    }
  }

  const filterUsers = () => {
    let filtered = users

    switch (activeTab) {
      case 'mentors':
        filtered = filtered.filter(u => u.roles.includes('mentor'))
        break
      case 'mentees':
        filtered = filtered.filter(u => u.roles.includes('mentee'))
        break
      case 'admins':
        filtered = filtered.filter(u => u.roles.includes('admin'))
        break
      case 'verified':
        filtered = filtered.filter(u => u.verified)
        break
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(user =>
        user.full_name?.toLowerCase().includes(term) ||
        user.first_name?.toLowerCase().includes(term) ||
        user.last_name?.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      )
    }

    setFilteredUsers(filtered)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'mentor': return 'bg-blue-100 text-blue-800'
      case 'mentee': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <RequireRole roles={['admin']}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando painel de controle...</span>
          </div>
        </div>
      </RequireRole>
    )
  }

  return (
    <RequireRole roles={['admin']}>
      <div className="container mx-auto px-4 py-8">
        <AdminBreadcrumb />
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Gestão Global de Usuários</h1>
              <p className="text-muted-foreground">
                Controle de permissões, mentores e métricas de engajamento
              </p>
            </div>
            <Button onClick={fetchUsers} variant="outline" className="w-full md:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar Dados
            </Button>
          </div>

          {/* Metrics Section */}
          <UserMetrics data={users} />

          {/* Search & List */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                  <div className="px-4 pt-4 border-b">
                    <TabsList className="w-full justify-start overflow-x-auto">
                      <TabsTrigger value="all">Todos ({stats.total})</TabsTrigger>
                      <TabsTrigger value="mentors">Mentores ({stats.mentors})</TabsTrigger>
                      <TabsTrigger value="mentees">Mentees ({stats.mentees})</TabsTrigger>
                      <TabsTrigger value="admins">Admins ({stats.admins})</TabsTrigger>
                      <TabsTrigger value="verified">Verificados ({stats.verified})</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value={activeTab} className="m-0">
                    <div className="divide-y">
                      {filteredUsers.length === 0 ? (
                        <div className="text-center py-12">
                          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium">Nenhum usuário encontrado</h3>
                        </div>
                      ) : (
                        filteredUsers.map((user) => (
                          <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                            <Avatar className="h-10 w-10 border">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm truncate">
                                  {user.full_name || 'Usuário sem nome'}
                                </span>
                                {user.verified && (
                                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 text-[10px] h-5">
                                    VERIFICADO
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                            </div>

                            <div className="hidden md:flex gap-1">
                              {user.roles.map(role => (
                                <Badge key={role} variant="outline" className={`${getRoleBadgeColor(role)} text-[10px]`}>
                                  {role.toUpperCase()}
                                </Badge>
                              ))}
                            </div>

                            <div className="text-xs text-muted-foreground hidden lg:block">
                              Desde {formatDate(user.created_at)}
                            </div>

                            <div className="flex items-center gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => window.open(`/mentors/${user.id}`, '_blank')}>
                                    <Eye className="mr-2 h-4 w-4" /> Ver Perfil Público
                                  </DropdownMenuItem>
                                  
                                  {user.roles.includes('mentor') && (
                                    <DropdownMenuItem onClick={() => toggleVerification(user.id, user.verified)}>
                                      {user.verified ? (
                                        <><X className="mr-2 h-4 w-4 text-red-500" /> Revogar Verificação</>
                                      ) : (
                                        <><Check className="mr-2 h-4 w-4 text-green-500" /> Aprovar Mentor</>
                                      )}
                                    </DropdownMenuItem>
                                  )}
                                  
                                  <DropdownMenuSeparator />
                                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Gerenciar Papéis</DropdownMenuLabel>
                                  <DropdownMenuItem className="text-xs">Tornar Admin (Pendente)</DropdownMenuItem>
                                  <DropdownMenuItem className="text-xs">Tornar Mentor (Pendente)</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RequireRole>
  )
}
