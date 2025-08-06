"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { Loader2, CalendarIcon, Clock, User, MessageSquare, CheckCircle, XCircle, Info, Edit, Trash2, Plus, Star, Award, Briefcase, GraduationCap, Languages, LinkIcon, Mail, Phone, MapPin } from 'lucide-react'
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useMentorship } from '@/hooks/useMentorship'
import { useUserProfile } from '@/hooks/useUserProfile'
import { MentorAvailabilitySettings } from '@/components/mentorship/MentorAvailabilitySettings'
import { SessionDetailsModal } from '@/components/mentorship/SessionDetailsModal'
import { SessionResponseModal } from '@/components/mentorship/SessionResponseModal'
import { format, parseISO, isSameDay, isBefore, addHours } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Session {
  id: string
  mentee_id: string
  mentor_id: string
  scheduled_at: string // ISO string
  duration_minutes: number
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled"
  topic: string
  description: string
  mentee_notes?: string
  mentor_notes?: string
  meeting_link?: string
  mentee_profile: {
    full_name: string
    avatar_url?: string
  }
  mentor_profile: {
    full_name: string
    avatar_url?: string
  }
}

export default function MentorshipPage() {
  const { user, loading: authLoading } = useAuth()
  const { userProfile, loading: profileLoading } = useUserProfile(user?.id)
  const router = useRouter()
  const {
    sessions,
    isLoading: sessionsLoading,
    error: sessionsError,
    acceptSession,
    rejectSession,
    completeSession,
    cancelSession,
  } = useMentorship(user?.id)

  const [activeTab, setActiveTab] = useState<"upcoming" | "pending" | "past" | "availability">("upcoming")
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false)
  const [responseAction, setResponseAction] = useState<"accept" | "reject" | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!authLoading && !profileLoading && (!user || userProfile?.role !== "mentor")) {
      router.push("/unauthorized")
    }
  }, [user, authLoading, profileLoading, userProfile, router])

  const handleAcceptSession = async (sessionId: string) => {
    setIsProcessing(true)
    try {
      await acceptSession(sessionId)
      toast({
        title: "Sessão Aceita!",
        description: "Você aceitou a solicitação de sessão.",
        variant: "default",
      })
      setSelectedSession(null)
      setIsResponseModalOpen(false)
    } catch (err: any) {
      toast({
        title: "Erro ao Aceitar Sessão",
        description: err.message || "Não foi possível aceitar a sessão.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectSession = async (sessionId: string) => {
    setIsProcessing(true)
    try {
      await rejectSession(sessionId)
      toast({
        title: "Sessão Rejeitada!",
        description: "Você rejeitou a solicitação de sessão.",
        variant: "default",
      })
      setSelectedSession(null)
      setIsResponseModalOpen(false)
    } catch (err: any) {
      toast({
        title: "Erro ao Rejeitar Sessão",
        description: err.message || "Não foi possível rejeitar a sessão.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCompleteSession = async (sessionId: string) => {
    setIsProcessing(true)
    try {
      await completeSession(sessionId)
      toast({
        title: "Sessão Concluída!",
        description: "A sessão foi marcada como concluída.",
        variant: "default",
      })
      setSelectedSession(null)
    } catch (err: any) {
      toast({
        title: "Erro ao Concluir Sessão",
        description: err.message || "Não foi possível marcar a sessão como concluída.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancelSession = async (sessionId: string) => {
    if (!confirm("Tem certeza que deseja cancelar esta sessão?")) return
    setIsProcessing(true)
    try {
      await cancelSession(sessionId)
      toast({
        title: "Sessão Cancelada!",
        description: "A sessão foi cancelada com sucesso.",
        variant: "default",
      })
      setSelectedSession(null)
    } catch (err: any) {
      toast({
        title: "Erro ao Cancelar Sessão",
        description: err.message || "Não foi possível cancelar a sessão.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getSessionStatusBadge = (status: Session['status']) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>
      case "accepted":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Aceita</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejeitada</Badge>
      case "completed":
        return <Badge className="bg-green-500 hover:bg-green-600">Concluída</Badge>
      case "cancelled":
        return <Badge variant="outline">Cancelada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getFilteredSessions = (status: Session['status'] | 'upcoming') => {
    const now = new Date()
    return sessions?.filter(session => {
      const sessionDate = parseISO(session.scheduled_at)
      if (status === 'upcoming') {
        return session.status === 'accepted' && isAfter(sessionDate, now)
      } else if (status === 'past') {
        return (session.status === 'completed' || session.status === 'cancelled') || isBefore(sessionDate, now)
      }
      return session.status === status
    }) || []
  }

  if (authLoading || profileLoading || (user && userProfile?.role !== "mentor" && !sessionsLoading)) {
    return null // Redirect handled by useEffect
  }

  if (sessionsLoading) {
    return (
      <div className="container py-8 md:py-12 flex justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Carregando suas sessões...</p>
      </div>
    )
  }

  if (sessionsError) {
    return (
      <div className="container py-8 md:py-12 text-center text-red-500">
        <p>Erro ao carregar sessões: {sessionsError.message}</p>
      </div>
    )
  }

  const upcomingSessions = getFilteredSessions('upcoming')
  const pendingSessions = getFilteredSessions('pending')
  const pastSessions = getFilteredSessions('past')

  return (
    <ProtectedRoute requiredRoles={['mentor']}>
      <div className="container py-8 md:py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">Minhas Mentorias</h1>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upcoming">Próximas ({upcomingSessions.length})</TabsTrigger>
            <TabsTrigger value="pending">Pendentes ({pendingSessions.length})</TabsTrigger>
            <TabsTrigger value="past">Anteriores ({pastSessions.length})</TabsTrigger>
            <TabsTrigger value="availability">Disponibilidade</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Próximas Sessões</CardTitle>
                <CardDescription>Sessões de mentoria confirmadas e futuras.</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingSessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Você não tem sessões futuras agendadas.</p>
                    <Button className="mt-4" onClick={() => router.push('/mentors')}>
                      Encontrar Mentees
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingSessions.map((session) => (
                      <div key={session.id} className="border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={session.mentee_profile.avatar_url || "/placeholder-user.jpg"} alt={session.mentee_profile.full_name} />
                            <AvatarFallback>{session.mentee_profile.full_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{session.mentee_profile.full_name}</h3>
                            <p className="text-sm text-muted-foreground">{session.topic}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(session.scheduled_at), "dd 'de' MMMM, HH:mm", { locale: ptBR })} ({session.duration_minutes} min)
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getSessionStatusBadge(session.status)}
                          <Button size="sm" variant="outline" onClick={() => setSelectedSession(session)}>
                            <Info className="h-4 w-4 mr-2" />
                            Detalhes
                          </Button>
                          <Button size="sm" onClick={() => window.open(session.meeting_link || '#', '_blank')}>
                            <Video className="h-4 w-4 mr-2" />
                            Entrar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Solicitações Pendentes</CardTitle>
                <CardDescription>Novas solicitações de mentoria aguardando sua resposta.</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingSessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Você não tem solicitações de sessão pendentes.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingSessions.map((session) => (
                      <div key={session.id} className="border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={session.mentee_profile.avatar_url || "/placeholder-user.jpg"} alt={session.mentee_profile.full_name} />
                            <AvatarFallback>{session.mentee_profile.full_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{session.mentee_profile.full_name}</h3>
                            <p className="text-sm text-muted-foreground">{session.topic}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(session.scheduled_at), "dd 'de' MMMM, HH:mm", { locale: ptBR })} ({session.duration_minutes} min)
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getSessionStatusBadge(session.status)}
                          <Button size="sm" onClick={() => { setSelectedSession(session); setResponseAction("accept"); setIsResponseModalOpen(true); }}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aceitar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setSelectedSession(session); setResponseAction("reject"); setIsResponseModalOpen(true); }}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="past" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Sessões Anteriores</CardTitle>
                <CardDescription>Seu histórico de sessões de mentoria.</CardDescription>
              </CardHeader>
              <CardContent>
                {pastSessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Você não tem sessões anteriores registradas.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pastSessions.map((session) => (
                      <div key={session.id} className="border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={session.mentee_profile.avatar_url || "/placeholder-user.jpg"} alt={session.mentee_profile.full_name} />
                            <AvatarFallback>{session.mentee_profile.full_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{session.mentee_profile.full_name}</h3>
                            <p className="text-sm text-muted-foreground">{session.topic}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(session.scheduled_at), "dd 'de' MMMM, HH:mm", { locale: ptBR })} ({session.duration_minutes} min)
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getSessionStatusBadge(session.status)}
                          <Button size="sm" variant="outline" onClick={() => setSelectedSession(session)}>
                            <Info className="h-4 w-4 mr-2" />
                            Detalhes
                          </Button>
                          {session.status === 'accepted' && isBefore(parseISO(session.scheduled_at), new Date()) && (
                            <Button size="sm" onClick={() => handleCompleteSession(session.id)} disabled={isProcessing}>
                              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                              Marcar como Concluída
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability" className="space-y-4 pt-4">
            <MentorAvailabilitySettings mentorId={user?.id || ''} />
          </TabsContent>
        </Tabs>

        {selectedSession && (
          <SessionDetailsModal
            isOpen={!!selectedSession}
            onClose={() => setSelectedSession(null)}
            session={selectedSession}
            isMentorView={true} // This component is for mentor's view
            onComplete={() => handleCompleteSession(selectedSession.id)}
            onCancel={() => handleCancelSession(selectedSession.id)}
            isProcessing={isProcessing}
          />
        )}

        {selectedSession && isResponseModalOpen && responseAction && (
          <SessionResponseModal
            isOpen={isResponseModalOpen}
            onClose={() => setIsResponseModalOpen(false)}
            session={selectedSession}
            actionType={responseAction}
            onConfirm={responseAction === "accept" ? handleAcceptSession : handleRejectSession}
            isProcessing={isProcessing}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}
