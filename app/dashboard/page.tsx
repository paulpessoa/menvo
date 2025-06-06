"use client"

import { useAuth } from "@/hooks/useAuth"
import { useUserRoles, useIsMentor, useIsMentee, useIsAdmin, usePrimaryRole } from "@/hooks/useUserRoles"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import {
  Calendar,
  Clock,
  Users,
  Star,
  TrendingUp,
  MessageSquare,
  Settings,
  User,
  Briefcase,
  BookOpen,
  Award,
  Target,
  Activity,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  Search,
  Bell,
  Filter
} from "lucide-react"
import Link from "next/link"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal"
import { useState, useEffect } from "react"

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user, loading } = useAuth()
  const router = useRouter()
  const primaryRole = usePrimaryRole()
  const isMentor = useIsMentor()
  const isMentee = useIsMentee()
  const isAdmin = useIsAdmin()
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      setShowLoginModal(true)
    }
  }, [user, loading])

  if (loading) {
    return <DashboardSkeleton />
  }

  if (!user) {
    return (
      <LoginRequiredModal 
        isOpen={showLoginModal}
        onClose={() => router.push('/')}
      />
    )
  }

  const renderMentorDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Bem-vindo, {user.user_metadata?.first_name || user.email?.split('@')[0]}!
          </h1>
          <p className="text-muted-foreground">
            Aqui está um resumo da sua atividade como mentor
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Definir Disponibilidade
          </Button>
          <Button variant="outline" asChild>
            <Link href="/profile/edit">
              <Settings className="h-4 w-4 mr-2" />
              Editar Perfil
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessões Este Mês</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+20% em relação ao mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.9</div>
            <div className="flex items-center mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Mentees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">+5 novos este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas de Mentoria</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">38h</div>
            <p className="text-xs text-muted-foreground">+12h em relação ao mês anterior</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions">Próximas Sessões</TabsTrigger>
          <TabsTrigger value="requests">Solicitações Pendentes</TabsTrigger>
          <TabsTrigger value="analytics">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Próximas Sessões</CardTitle>
                <CardDescription>Suas sessões agendadas para os próximos dias</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((session) => (
                  <div key={session} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">João Silva</p>
                        <p className="text-sm text-muted-foreground">Transição de Carreira</p>
                        <p className="text-xs text-muted-foreground">Amanhã às 14:00</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Ver Detalhes
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  Ver Todas as Sessões
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
                <CardDescription>Suas atividades dos últimos dias</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm">Sessão concluída com Maria Santos</p>
                      <p className="text-xs text-muted-foreground">2 horas atrás</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm">Nova mensagem de Pedro Oliveira</p>
                      <p className="text-xs text-muted-foreground">5 horas atrás</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="h-4 w-4 text-yellow-600" />
                    <div className="flex-1">
                      <p className="text-sm">Recebeu avaliação 5 estrelas</p>
                      <p className="text-xs text-muted-foreground">1 dia atrás</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações Pendentes</CardTitle>
              <CardDescription>Novos mentees esperando sua aprovação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2].map((request) => (
                <div key={request} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Ana Costa</p>
                        <p className="text-sm text-muted-foreground">Estudante de Design UX</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Novo</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Tópico:</strong> Orientação sobre portfolio de UX Design
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Data solicitada:</strong> 25/01/2024 às 15:00
                    </p>
                  </div>
                  <div className="text-sm">
                    "Olá! Gostaria de orientação sobre como montar um portfolio sólido de UX Design para conseguir minha primeira oportunidade na área..."
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm">Aceitar</Button>
                    <Button size="sm" variant="outline">Declinar</Button>
                    <Button size="sm" variant="ghost">Ver Perfil</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Progresso Mensal</CardTitle>
                <CardDescription>Suas estatísticas de mentoria</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Meta de sessões mensais</span>
                    <span>12/15</span>
                  </div>
                  <Progress value={80} className="w-full" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Taxa de satisfação</span>
                    <span>98%</span>
                  </div>
                  <Progress value={98} className="w-full" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Tempo de resposta médio</span>
                    <span>2.5h</span>
                  </div>
                  <Progress value={85} className="w-full" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tópicos Mais Procurados</CardTitle>
                <CardDescription>Áreas onde você mais mentora</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Transição de Carreira</span>
                  <Badge variant="secondary">45%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Preparação para Entrevistas</span>
                  <Badge variant="secondary">30%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Desenvolvimento Técnico</span>
                  <Badge variant="secondary">15%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Liderança</span>
                  <Badge variant="secondary">10%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )

  const renderMenteeDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Olá, {user.user_metadata?.first_name || user.email?.split('@')[0]}!
          </h1>
          <p className="text-muted-foreground">
            Continue sua jornada de desenvolvimento com mentoria personalizada
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/mentors">
              <Search className="h-4 w-4 mr-2" />
              Encontrar Mentores
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/profile/edit">
              <Settings className="h-4 w-4 mr-2" />
              Meu Perfil
            </Link>
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessões Realizadas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">+3 este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mentores Conectados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Em diferentes áreas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Objetivos Alcançados</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5/7</div>
            <p className="text-xs text-muted-foreground">71% completo</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions">Minhas Sessões</TabsTrigger>
          <TabsTrigger value="goals">Meus Objetivos</TabsTrigger>
          <TabsTrigger value="mentors">Meus Mentores</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Próximas Sessões</CardTitle>
                <CardDescription>Suas sessões agendadas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Mentoria com Sarah Johnson</p>
                      <p className="text-sm text-muted-foreground">Preparação para Entrevistas</p>
                      <p className="text-xs text-blue-600">Hoje às 16:00</p>
                    </div>
                  </div>
                  <Button size="sm">Entrar</Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Mentoria com Carlos Silva</p>
                      <p className="text-sm text-muted-foreground">Transição de Carreira</p>
                      <p className="text-xs text-muted-foreground">Amanhã às 14:00</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Ver Detalhes</Button>
                </div>

                <Button variant="outline" className="w-full" asChild>
                  <Link href="/mentors">
                    <Plus className="h-4 w-4 mr-2" />
                    Agendar Nova Sessão
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Histórico Recente</CardTitle>
                <CardDescription>Suas últimas atividades</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm">Sessão concluída com Ana Costa</p>
                      <p className="text-xs text-muted-foreground">Design UX - Ontem</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="h-4 w-4 text-yellow-600" />
                    <div className="flex-1">
                      <p className="text-sm">Avaliou sessão com 5 estrelas</p>
                      <p className="text-xs text-muted-foreground">2 dias atrás</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm">Enviou mensagem para mentor</p>
                      <p className="text-xs text-muted-foreground">3 dias atrás</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Meus Objetivos de Desenvolvimento</CardTitle>
              <CardDescription>Acompanhe seu progresso em direção aos seus objetivos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium">Conseguir primeira vaga em UX Design</h3>
                      <p className="text-sm text-muted-foreground">Prazo: Março 2024</p>
                    </div>
                    <Badge variant="secondary">80%</Badge>
                  </div>
                  <Progress value={80} className="mb-2" />
                  <div className="text-xs text-muted-foreground">
                    4 de 5 marcos concluídos
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium">Melhorar skills de apresentação</h3>
                      <p className="text-sm text-muted-foreground">Prazo: Fevereiro 2024</p>
                    </div>
                    <Badge variant="secondary">60%</Badge>
                  </div>
                  <Progress value={60} className="mb-2" />
                  <div className="text-xs text-muted-foreground">
                    3 de 5 marcos concluídos
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium">Aprender React avançado</h3>
                      <p className="text-sm text-muted-foreground">Prazo: Abril 2024</p>
                    </div>
                    <Badge variant="outline">30%</Badge>
                  </div>
                  <Progress value={30} className="mb-2" />
                  <div className="text-xs text-muted-foreground">
                    2 de 6 marcos concluídos
                  </div>
                </div>
              </div>
              
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Novo Objetivo
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mentors" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah Johnson",
                role: "Senior UX Designer",
                company: "TechCorp",
                rating: 4.9,
                sessions: 3,
                nextSession: "Hoje às 16:00"
              },
              {
                name: "Carlos Silva",
                role: "Tech Lead",
                company: "StartupX", 
                rating: 4.8,
                sessions: 2,
                nextSession: "Amanhã às 14:00"
              },
              {
                name: "Ana Costa",
                role: "Product Manager",
                company: "InnovateCorp",
                rating: 5.0,
                sessions: 3,
                nextSession: null
              }
            ].map((mentor, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{mentor.name}</h3>
                      <p className="text-sm text-muted-foreground">{mentor.role}</p>
                      <p className="text-xs text-muted-foreground">{mentor.company}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Avaliação:</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{mentor.rating}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Sessões:</span>
                      <span>{mentor.sessions}</span>
                    </div>
                    {mentor.nextSession && (
                      <div className="flex justify-between text-sm">
                        <span>Próxima:</span>
                        <span className="text-blue-600">{mentor.nextSession}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Mensagem
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      Agendar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground">Visão geral da plataforma Menvo</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button>
            <BarChart3 className="h-4 w-4 mr-2" />
            Relatórios
          </Button>
        </div>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+12% este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessões Ativas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">+5% esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.5%</div>
            <p className="text-xs text-muted-foreground">+2.1% este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notificações</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-red-500">3 críticas</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="sessions">Sessões</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { type: "user", message: "Novo mentor registrado: Maria Silva", time: "5 min" },
                  { type: "session", message: "Sessão cancelada por João Santos", time: "15 min" },
                  { type: "alert", message: "Taxa de abandono acima do limite", time: "1h" },
                  { type: "user", message: "Mentor verificado: Pedro Costa", time: "2h" }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded">
                    <div className={`h-2 w-2 rounded-full ${
                      activity.type === 'alert' ? 'bg-red-500' : 
                      activity.type === 'user' ? 'bg-green-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time} atrás</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas Principais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Mentores Ativos</span>
                    <span>145/200</span>
                  </div>
                  <Progress value={72.5} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Satisfação Geral</span>
                    <span>4.7/5.0</span>
                  </div>
                  <Progress value={94} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Tempo Médio de Resposta</span>
                    <span>2.3h</span>
                  </div>
                  <Progress value={85} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Usuários</CardTitle>
              <CardDescription>Administre mentores, mentees e outros usuários</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Funcionalidade de gestão de usuários em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Monitoramento de Sessões</CardTitle>
              <CardDescription>Acompanhe todas as sessões de mentoria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sistema de monitoramento de sessões em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios e Analytics</CardTitle>
              <CardDescription>Relatórios detalhados sobre a plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sistema de relatórios em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )

  // Render dashboard based on primary role
  if (isAdmin) {
    return <div className="container py-8 md:py-12">{renderAdminDashboard()}</div>
  } else if (isMentor && primaryRole === 'mentor') {
    return <div className="container py-8 md:py-12">{renderMentorDashboard()}</div>
  } else {
    return <div className="container py-8 md:py-12">{renderMenteeDashboard()}</div>
  }
}

function DashboardSkeleton() {
  return (
    <div className="container py-8 md:py-12 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-24" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 