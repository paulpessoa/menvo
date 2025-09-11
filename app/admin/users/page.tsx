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
  Eye
} from "lucide-react"
import { RequireRole } from "@/lib/auth/auth-guard"
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb"
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

  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, activeTab])

  const fetchUsers = async () => {
    setLoading(true)

    try {
      // Fetch all users with their roles
      const { data, error } = await supabase
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

      if (error) throw error

      // Transform data to include roles array
      const userData = (data || []).map(user => ({
        ...user,
        roles: user.user_roles?.map(ur => ur.roles?.name).filter(Boolean) || []
      }))

      setUsers(userData)

      // Calculate stats
      const total = userData.length
      const mentors = userData.filter(u => u.roles.includes('mentor')).length
      const mentees = userData.filter(u => u.roles.includes('mentee')).length
      const admins = userData.filter(u => u.roles.includes('admin')).length
      const verified = userData.filter(u => u.verified).length

      setStats({ total, mentors, mentees, admins, verified })
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Filter by tab
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
      // 'all' shows everything
    }

    // Filter by search term
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
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'mentor':
        return 'bg-blue-100 text-blue-800'
      case 'mentee':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'all':
        return stats.total
      case 'mentors':
        return stats.mentors
      case 'mentees':
        return stats.mentees
      case 'admins':
        return stats.admins
      case 'verified':
        return stats.verified
      default:
        return 0
    }
  }

  if (loading) {
    return (
      <RequireRole roles={['admin']}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando usuários...</span>
          </div>
        </div>
      </RequireRole>
    )
  }

  return (
    <RequireRole roles={['admin']}>
      <div className="container mx-auto px-4 py-8">
        <AdminBreadcrumb />
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
              <p className="text-muted-foreground">
                Visualize e gerencie todos os usuários da plataforma
              </p>
            </div>
            <Button onClick={fetchUsers} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mentores</CardTitle>
                <UserCheck className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.mentors}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mentees</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.mentees}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admins</CardTitle>
                <Shield className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.admins}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verificados</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Buscar Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lista de Usuários</CardTitle>
              <CardDescription>
                {filteredUsers.length} usuário(s) encontrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="all">
                    Todos ({getTabCount('all')})
                  </TabsTrigger>
                  <TabsTrigger value="mentors">
                    Mentores ({getTabCount('mentors')})
                  </TabsTrigger>
                  <TabsTrigger value="mentees">
                    Mentees ({getTabCount('mentees')})
                  </TabsTrigger>
                  <TabsTrigger value="admins">
                    Admins ({getTabCount('admins')})
                  </TabsTrigger>
                  <TabsTrigger value="verified">
                    Verificados ({getTabCount('verified')})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Nenhum usuário encontrado</h3>
                      <p className="text-muted-foreground">
                        {searchTerm
                          ? "Tente ajustar os filtros de busca"
                          : "Não há usuários nesta categoria"
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredUsers.map((user) => (
                        <Card key={user.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary/10">
                                  {getInitials(user.full_name)}
                                </AvatarFallback>
                              </Avatar>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold truncate">
                                    {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Usuário sem nome'}
                                  </h3>
                                  {user.verified && (
                                    <Badge variant="outline" className="bg-green-100 text-green-800">
                                      Verificado
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                                  <Mail className="h-4 w-4" />
                                  <span className="truncate">{user.email}</span>
                                </div>

                                <div className="flex items-center gap-2 mb-2">
                                  {user.roles.length > 0 ? (
                                    user.roles.map((role) => (
                                      <Badge
                                        key={role}
                                        variant="outline"
                                        className={getRoleBadgeColor(role)}
                                      >
                                        {role}
                                      </Badge>
                                    ))
                                  ) : (
                                    <Badge variant="outline" className="bg-gray-100 text-gray-800">
                                      Sem role
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>Cadastrado em {formatDate(user.created_at)}</span>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button size="sm" variant="outline">
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver Perfil
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </RequireRole>
  )
}