"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar, Clock, User, MessageSquare, Info, CheckCircle, XCircle, Loader2, Video } from 'lucide-react'

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

interface SessionDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  session: Session
  isMentorView: boolean // True if the current user is the mentor of this session
  onComplete?: (sessionId: string) => void
  onCancel?: (sessionId: string) => void
  isProcessing?: boolean
}

export function SessionDetailsModal({
  isOpen,
  onClose,
  session,
  isMentorView,
  onComplete,
  onCancel,
  isProcessing = false,
}: SessionDetailsModalProps) {
  const getStatusBadge = (status: Session['status']) => {
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

  const participant = isMentorView ? session.mentee_profile : session.mentor_profile
  const role = isMentorView ? "Mentee" : "Mentor"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detalhes da Sessão</DialogTitle>
          <DialogDescription>
            Informações detalhadas sobre sua sessão de mentoria.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={participant.avatar_url || "/placeholder-user.jpg"} alt={participant.full_name} />
              <AvatarFallback>{participant.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{participant.full_name}</h3>
              <p className="text-muted-foreground">{role}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Data:
            </p>
            <p className="text-muted-foreground ml-6">
              {format(parseISO(session.scheduled_at), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" /> Horário:
            </p>
            <p className="text-muted-foreground ml-6">
              {format(parseISO(session.scheduled_at), "HH:mm", { locale: ptBR })} ({session.duration_minutes} minutos)
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Info className="h-4 w-4" /> Status:
            </p>
            <div className="ml-6">{getStatusBadge(session.status)}</div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Tópico:
            </p>
            <p className="text-muted-foreground ml-6">{session.topic}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Descrição:</p>
            <p className="text-muted-foreground ml-6">{session.description}</p>
          </div>
          {session.mentee_notes && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Notas do Mentee:</p>
              <p className="text-muted-foreground ml-6">{session.mentee_notes}</p>
            </div>
          )}
          {session.mentor_notes && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Notas do Mentor:</p>
              <p className="text-muted-foreground ml-6">{session.mentor_notes}</p>
            </div>
          )}

          {session.meeting_link && session.status === 'accepted' && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Video className="h-4 w-4" /> Link da Reunião:
                </p>
                <a href={session.meeting_link} target="_blank" rel="noopener noreferrer" className="text-primary underline ml-6">
                  {session.meeting_link}
                </a>
              </div>
            </>
          )}
        </div>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4">
          {isMentorView && session.status === 'accepted' && (
            <Button
              variant="outline"
              onClick={() => onComplete?.(session.id)}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Marcar como Concluída
            </Button>
          )}
          {(session.status === 'pending' || session.status === 'accepted') && (
            <Button
              variant="destructive"
              onClick={() => onCancel?.(session.id)}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Cancelar Sessão
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
