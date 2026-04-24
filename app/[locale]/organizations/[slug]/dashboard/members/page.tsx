"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, UserPlus, Loader2, MoreHorizontal, ShieldAlert, Trash2, Mail } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Member {
  id: string
  user_id: string
  role: string
  status: string
  invited_at: string
  user: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  }
}

export default function OrganizationMembersPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchMembers = useCallback(async (organizationId: string) => {
    try {
      const res = await fetch(`/api/organizations/${organizationId}/members`)
      const data = await res.json()
      if (data.success) {
        setMembers(data.data)
      } else {
        toast.error("Erro ao carregar lista de membros")
      }
    } catch (err) {
      toast.error("Erro de conexão ao buscar membros")
    }
  }, [])

  const checkAccessAndLoad = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Validar acesso e pegar o ID da org
      const response = await fetch(`/api/organizations/${slug}`)
      if (!response.ok) {
        router.push("/organizations")
        return
      }
      const data = await response.json()
      
      // 'is_admin' agora retorna true para Super Admins ou Admins da Org no backend
      if (!data.is_admin) {
        toast.error("Acesso negado. Apenas administradores podem gerenciar membros.")
        router.push(`/organizations/${slug}`)
        return
      }
      
      setOrgId(data.organization.id)
      
      // 2. Buscar Membros
      await fetchMembers(data.organization.id)
      
    } catch (err) {
      router.push("/organizations")
    } finally {
      setLoading(false)
    }
  }, [slug, router, fetchMembers])

  useEffect(() => {
    if (slug) {
      checkAccessAndLoad()
    }
  }, [slug, checkAccessAndLoad])

  const removeMember = async (memberId: string) => {
    if (!orgId) return
    if (!confirm("Tem certeza que deseja remover este membro da organização?")) return

    setProcessingId(memberId)
    try {
      const res = await fetch(`/api/organizations/${orgId}/members/${memberId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Membro removido com sucesso")
        setMembers(prev => prev.filter(m => m.id !== memberId))
      } else {
        throw new Error(data.error?.message || "Erro ao remover")
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setProcessingId(null)
    }
  }

  const changeRole = async (memberId: string, newRole: string) => {
    if (!orgId) return
    setProcessingId(memberId)
    try {
      const res = await fetch(`/api/organizations/${orgId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Papel atualizado com sucesso")
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m))
      } else {
        throw new Error(data.error?.message || "Erro ao atualizar")
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button variant="ghost" asChild className="mb-4 -ml-4 text-muted-foreground hover:text-foreground">
            <Link href={`/organizations/${slug}/dashboard`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Painel da Organização
            </Link>
          </Button>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gestão de Membros</h1>
              <p className="text-muted-foreground mt-1">Gerencie os voluntários, mentees e administradores da sua organização.</p>
            </div>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href={`/organizations/${slug}/dashboard/invitations`}>
                <UserPlus className="w-4 h-4 mr-2" />
                Convidar Membros
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              Equipe e Participantes
              <Badge variant="secondary" className="ml-2">{members.length}</Badge>
            </CardTitle>
            <CardDescription>
              Todos os membros que fazem parte ou foram convidados para a organização.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {members.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Nenhum membro encontrado.</p>
                <Button variant="link" asChild className="mt-2">
                   <Link href={`/organizations/${slug}/dashboard/invitations`}>Convide seu primeiro membro</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {members.map((member) => {
                  const isPending = member.status === 'invited'
                  return (
                    <div key={member.id} className="flex items-center justify-between p-4 sm:px-6 hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border">
                          <AvatarImage src={member.user?.avatar_url || ''} />
                          <AvatarFallback className="bg-primary/5 text-primary">
                            {member.user?.full_name?.charAt(0) || <Mail className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm">
                            {member.user?.full_name || 'Usuário Convidado'}
                          </p>
                          <p className="text-xs text-muted-foreground">{member.user?.email || 'Email oculto'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end gap-1">
                          <Badge variant={isPending ? 'outline' : 'default'} className={isPending ? 'text-yellow-600 border-yellow-300 bg-yellow-50' : 'bg-green-100 text-green-800 hover:bg-green-100'}>
                            {isPending ? 'Pendente' : 'Ativo'}
                          </Badge>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">
                            {member.role === 'admin' ? 'Administrador' : member.role === 'mentor' ? 'Mentor' : 'Mentee'}
                          </span>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={processingId === member.id}>
                              {processingId === member.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Gerenciar Membro</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground pb-1">Alterar Papel para:</DropdownMenuLabel>
                            <DropdownMenuItem disabled={member.role === 'admin'} onClick={() => changeRole(member.id, 'admin')}>
                              Tornar Administrador
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled={member.role === 'mentor'} onClick={() => changeRole(member.id, 'mentor')}>
                              Tornar Mentor
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled={member.role === 'member'} onClick={() => changeRole(member.id, 'member')}>
                              Tornar Mentee
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                              onClick={() => removeMember(member.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Remover da Organização
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
