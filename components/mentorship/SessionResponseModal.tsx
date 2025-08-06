"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

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

interface SessionResponseModalProps {
  isOpen: boolean
  onClose: () => void
  session: Session
  actionType: "accept" | "reject"
  onConfirm: (sessionId: string, notes?: string, meetingLink?: string) => void
  isProcessing: boolean
}

export function SessionResponseModal({
  isOpen,
  onClose,
  session,
  actionType,
  onConfirm,
  isProcessing,
}: SessionResponseModalProps) {
  const [notes, setNotes] = useState("")
  const [meetingLink, setMeetingLink] = useState("")

  const handleConfirm = () => {
    onConfirm(session.id, notes, meetingLink)
  }

  const title = actionType === "accept" ? "Aceitar Sessão" : "Rejeitar Sessão"
  const description = actionType === "accept"
    ? `Confirme que você deseja aceitar a sessão com ${session.mentee_profile.full_name}.`
    : `Confirme que você deseja rejeitar a sessão com ${session.mentee_profile.full_name}.`
  const confirmButtonText = actionType === "accept" ? "Aceitar e Confirmar" : "Rejeitar Sessão"
  const confirmButtonIcon = actionType === "accept" ? CheckCircle : XCircle

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="bg-muted p-3 rounded-lg text-sm">
            <p><strong>Mentee:</strong> {session.mentee_profile.full_name}</p>
            <p><strong>Data:</strong> {format(parseISO(session.scheduled_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
            <p><strong>Tópico:</strong> {session.topic}</p>
          </div>

          {actionType === "accept" && (
            <div className="space-y-2">
              <Label htmlFor="meeting-link">Link da Reunião (Google Meet, Zoom, etc.)</Label>
              <Input
                id="meeting-link"
