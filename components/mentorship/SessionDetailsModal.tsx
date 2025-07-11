"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { 
  Calendar, 
  Clock, 
  User, 
  Video, 
  MessageSquare, 
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface SessionDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  session: any
  isMentor?: boolean
}

export function SessionDetailsModal({ isOpen, onClose, session, isMentor }: SessionDetailsModalProps) {
  if (!session) return null

  const otherUser = isMentor ? session.mentee : session.mentor
  const sessionDate = new Date(`${session.requested_date}T${session.requested_start_time}`)
  const isUpcoming = sessionDate > new Date()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendente',
      confirmed: 'Confirmada',
      rejected: 'Rejeitada',
      completed: 'Completa',
      cancelled: 'Cancelada'
    }
    return labels[status as keyof typeof labels] || status
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes da Sessão
          </DialogTitle>
          <DialogDescription>
            Informações completas sobre esta sessão de mentoria
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(session.status)}
              <span className="font-medium">Status:</span>
            </div>
            <Badge className={getStatusColor(session.status)}>
              {getStatusLabel(session.status)}
            </Badge>
          </div>

          <Separator />

          {/* Participants */}
          <div className="space-y-4">
            <h3 className="font-semibold">Participantes</h3>
            
            {/* Mentor */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Avatar>
                <AvatarImage src={session.mentor?.avatar_url} />
                <AvatarFallback>
                  {session.mentor?.first_name?.[0]}{session.mentor?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">
                    {session.mentor?.first_name} {session.mentor?.last_name}
                  </h4>
                  <Badge variant="outline" className="text-xs">Mentor</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{session.mentor?.email}</p>
              </div>
            </div>

            {/* Mentee */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Avatar>
                <AvatarImage src={session.mentee?.avatar_url} />
                <AvatarFallback>
                  {session.mentee?.first_name?.[0]}{session.mentee?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">
                    {session.mentee?.first_name} {session.mentee?.last_name}
                  </h4>
                  <Badge variant="outline" className="text-xs">Mentorado</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{session.mentee?.email}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Session Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Informações da Sessão</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Data:</span>
                </div>
                <p className="text-sm ml-6">
                  {format(sessionDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Horário:</span>
                </div>
                <p className="text-sm ml-6">
                  {session.requested_start_time.substring(0, 5)} - {session.requested_end_time.substring(0, 5)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Tópico:</h4>
              <p className="text-sm bg-muted/50 p-3 rounded-lg">{session.topic}</p>
            </div>

            {session.description && (
              <div className="space-y-2">
                <h4 className="font-medium">Descrição:</h4>
                <p className="text-sm bg-muted/50 p-3 rounded-lg">{session.description}</p>
              </div>
            )}
          </div>

          {/* Meeting Link */}
          {session.meeting_link && session.status === 'confirmed' && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Link da Reunião:
                </h4>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" className="flex-1">
                    <a href={session.meeting_link} target="_blank" rel="noopener noreferrer">
                      <Video className="h-4 w-4 mr-2" />
                      Entrar na Reunião
                    </a>
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {(session.mentee_notes || session.mentor_notes || session.mentor_response) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold">Anotações</h3>
                
                {session.mentee_notes && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Notas do Mentorado:</h4>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{session.mentee_notes}</p>
                  </div>
                )}
                
                {session.mentor_response && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">
                      {session.status === 'rejected' ? 'Motivo da Rejeição:' : 'Resposta do Mentor:'}
                    </h4>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{session.mentor_response}</p>
                  </div>
                )}
                
                {session.mentor_notes && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Notas Pós-Sessão (Mentor):</h4>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{session.mentor_notes}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Timestamps */}
          <Separator />
          <div className="space-y-2">
            <h3 className="font-semibold">Histórico</h3>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>Solicitada em: {format(new Date(session.requested_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              {session.responded_at && (
                <p>Respondida em: {format(new Date(session.responded_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              )}
              {session.completed_at && (
                <p>Completa em: {format(new Date(session.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
