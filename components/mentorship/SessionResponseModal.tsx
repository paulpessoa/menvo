"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle, XCircle, Calendar, Clock, User, Video } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useRespondToSession } from "@/hooks/useMentorship"

interface SessionResponseModalProps {
  isOpen: boolean
  onClose: () => void
  session: any
}

export function SessionResponseModal({ isOpen, onClose, session }: SessionResponseModalProps) {
  const [response, setResponse] = useState<'confirmed' | 'rejected' | null>(null)
  const [mentorResponse, setMentorResponse] = useState("")
  const [meetingLink, setMeetingLink] = useState("")

  const respondToSessionMutation = useRespondToSession()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!response) return

    try {
      await respondToSessionMutation.mutateAsync({
        session_id: session.id,
        status: response,
        mentor_response: mentorResponse.trim() || undefined,
        meeting_link: response === 'confirmed' ? meetingLink.trim() || undefined : undefined
      })
      
      // Reset form and close modal
      setResponse(null)
      setMentorResponse("")
      setMeetingLink("")
      onClose()
    } catch (error) {
      console.error('Erro ao responder sessão:', error)
    }
  }

  const handleClose = () => {
    setResponse(null)
    setMentorResponse("")
    setMeetingLink("")
    onClose()
  }

  if (!session) return null

  const sessionDate = new Date(`${session.requested_date}T${session.requested_start_time}`)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Responder Solicitação de Mentoria
          </DialogTitle>
          <DialogDescription>
            Revise os detalhes da solicitação e escolha sua resposta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Details */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={session.mentee?.avatar_url} />
                <AvatarFallback>
                  {session.mentee?.first_name?.[0]}{session.mentee?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">
                  {session.mentee?.first_name} {session.mentee?.last_name}
                </h3>
                <p className="text-sm text-muted-foreground">{session.mentee?.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span>{format(sessionDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>
                  {session.requested_start_time.substring(0, 5)} - {session.requested_end_time.substring(0, 5)}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-1">Tópico:</h4>
              <p className="text-sm">{session.topic}</p>
            </div>

            {session.description && (
              <div>
                <h4 className="font-medium mb-1">Descrição:</h4>
                <p className="text-sm text-muted-foreground">{session.description}</p>
              </div>
            )}

            {session.mentee_notes && (
              <div>
                <h4 className="font-medium mb-1">Notas do Mentorado:</h4>
                <p className="text-sm text-muted-foreground">{session.mentee_notes}</p>
              </div>
            )}
          </div>

          {/* Response Selection */}
          <div className="space-y-3">
            <Label>Sua Resposta</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={response === 'confirmed' ? "default" : "outline"}
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => setResponse('confirmed')}
              >
                <CheckCircle className="h-6 w-6 text-green-600" />
                <span>Confirmar</span>
              </Button>
              <Button
                type="button"
                variant={response === 'rejected' ? "destructive" : "outline"}
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => setResponse('rejected')}
              >
                <XCircle className="h-6 w-6 text-red-600" />
                <span>Rejeitar</span>
              </Button>
            </div>
          </div>

          {/* Meeting Link (if confirmed) */}
          {response === 'confirmed' && (
            <div className="space-y-2">
              <Label htmlFor="meetingLink">Link da Reunião (Opcional)</Label>
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="meetingLink"
                  placeholder="https://meet.google.com/... ou https://zoom.us/..."
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Adicione o link do Google Meet, Zoom ou outra plataforma de videochamada
              </p>
            </div>
          )}

          {/* Response Message */}
          <div className="space-y-2">
            <Label htmlFor="mentorResponse">
              {response === 'confirmed' ? 'Mensagem de Confirmação (Opcional)' : 'Motivo da Rejeição (Opcional)'}
            </Label>
            <Textarea
              id="mentorResponse"
              placeholder={
                response === 'confirmed' 
                  ? "Estou ansioso para nossa sessão! Vamos discutir..."
                  : "Infelizmente não posso atender neste horário porque..."
              }
              value={mentorResponse}
              onChange={(e) => setMentorResponse(e.target.value)}
              rows={3}
            />
          </div>

          <form onSubmit={handleSubmit}>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={!response || respondToSessionMutation.isPending}
                variant={response === 'rejected' ? 'destructive' : 'default'}
              >
                {respondToSessionMutation.isPending ? 'Enviando...' : 
                 response === 'confirmed' ? 'Confirmar Sessão' : 'Rejeitar Solicitação'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
} 