"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { 
  Calendar, 
  Clock, 
  User, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Video,
  FileText,
  Settings
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { 
  useMentorSessions, 
  useMenteeSessions, 
  useRespondToSession,
  useCompleteSession,
  useCancelSession
} from "@/hooks/useMentorship"

// import { SessionResponseModal } from "@/components/mentorship/SessionResponseModal"
// import { SessionDetailsModal } from "@/components/mentorship/SessionDetailsModal"
// import { MentorAvailabilitySettings } from "@/components/mentorship/MentorAvailabilitySettings"
// import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
// import { useUserRoles } from "../context/user-roles-context"

export default function MentorshipPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false)
const useUserRoles = () => {
  return {
    roles: ['mentor', 'mentee']
  }  
  }

  const userRoles = useUserRoles()
  const isMentor = userRoles?.roles.some(role => role === 'mentor')
  const isMentee = userRoles?.roles.some(role => role === 'mentee')
  

  // Hooks para sessões
  const { data: mentorSessions } = useMentorSessions()
  const { data: menteeSessions } = useMenteeSessions()
  
  // Mutations
  const respondToSessionMutation = useRespondToSession()
  const completeSessionMutation = useCompleteSession()
  const cancelSessionMutation = useCancelSession()

  // Filtrar sessões por status
  const pendingSessions = mentorSessions?.filter(s => s.status === 'pending') || []
  const confirmedSessions = mentorSessions?.filter(s => s.status === 'confirmed') || []
  const completedSessions = mentorSessions?.filter(s => s.status === 'completed') || []
  
  const myMenteeRequests = menteeSessions?.filter(s => s.status === 'pending') || []
  const myConfirmedSessions = menteeSessions?.filter(s => s.status === 'confirmed') || []
  const myCompletedSessions = menteeSessions?.filter(s => s.status === 'completed') || []

  const handleSessionResponse = (session: any) => {
    setSelectedSession(session)
    setIsResponseModalOpen(true)
  }

  const handleSessionDetails = (session: any) => {
    setSelectedSession(session)
    setIsDetailsModalOpen(true)
  }

  const handleCompleteSession = async (sessionId: string) => {
    try {
      await completeSessionMutation.mutateAsync({ sessionId })
    } catch (error) {
      console.error('Erro ao completar sessão:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmada', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejeitada', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
      completed: { label: 'Completa', variant: 'outline' as const, color: 'bg-blue-100 text-blue-800' },
      cancelled: { label: 'Cancelada', variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    )
  }

  return (
    // <ProtectedRoute requiredRoles={['mentor', 'mentee']}>
      <div className="container py-8">
        {isMentor && (
          <div>
            {/* Conteúdo específico para mentores */}
            <h1>Dashboard do Mentor</h1>
            {/* ... outros componentes ... */}
          </div>
        )}

        {isMentee && (
          <div>
            {/* Conteúdo específico para mentorados */}
            <h1>Dashboard do Mentorado</h1>
            {/* ... outros componentes ... */}
          </div>
        )}
      </div>
    // </ProtectedRoute>
  )
}

interface SessionCardProps {
  session: any
  isMentor?: boolean
  onRespond: () => void
  onViewDetails: () => void
  onComplete: () => void
}

function SessionCard({ session, isMentor, onRespond, onViewDetails, onComplete }: SessionCardProps) {
  const otherUser = isMentor ? session.mentee : session.mentor
  const sessionDate = new Date(`${session.requested_date}T${session.requested_start_time}`)
  const isUpcoming = sessionDate > new Date()
  const canComplete = isMentor && session.status === 'confirmed' && !isUpcoming

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <Avatar>
              <AvatarImage src={otherUser?.avatar_url} />
              <AvatarFallback>
                {otherUser?.first_name?.[0]}{otherUser?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    {otherUser?.first_name} {otherUser?.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{session.topic}</p>
                </div>
                {session.status && (
                  <Badge variant="secondary" className="ml-2">
                    {session.status === 'pending' ? 'Pendente' :
                     session.status === 'confirmed' ? 'Confirmada' :
                     session.status === 'completed' ? 'Completa' :
                     session.status === 'rejected' ? 'Rejeitada' : 'Cancelada'}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(session.requested_date), "dd 'de' MMMM", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {session.requested_start_time.substring(0, 5)} - {session.requested_end_time.substring(0, 5)}
                  </span>
                </div>
              </div>
              
              {session.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {session.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            {session.status === 'pending' && isMentor && (
              <Button size="sm" onClick={onRespond}>
                Responder
              </Button>
            )}
            
            {session.status === 'confirmed' && session.meeting_link && (
              <Button size="sm" variant="outline" asChild>
                <a href={session.meeting_link} target="_blank" rel="noopener noreferrer">
                  <Video className="h-4 w-4 mr-1" />
                  Entrar
                </a>
              </Button>
            )}
            
            {canComplete && (
              <Button size="sm" variant="outline" onClick={onComplete}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Completar
              </Button>
            )}
            
            <Button size="sm" variant="ghost" onClick={onViewDetails}>
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 