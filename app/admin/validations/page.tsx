"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar, User, CheckCircle, XCircle, Eye, ExternalLink, Play } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/services/auth/supabase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Validation {
  id: string
  user_id: string
  user_type: string
  youtube_video_url: string
  status: string
  submitted_at: string
  user_profile: {
    first_name: string
    last_name: string
    email: string
    bio: string
    location: string
    linkedin_url: string
    avatar_url: string
  }
}

export default function ValidationsPage() {
  const { user } = useAuth()
  const [validations, setValidations] = useState<Validation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedValidation, setSelectedValidation] = useState<Validation | null>(null)

  useEffect(() => {
    loadValidations()
  }, [])

  const loadValidations = async () => {
    try {
      const { data, error } = await supabase
        .from("user_validations")
        .select(`
          *,
          user_profile:profiles(*)
        `)
        .eq("status", "pending")
        .order("submitted_at", { ascending: true })

      if (error) throw error
      setValidations(data || [])
    } catch (error) {
      console.error("Error loading validations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (validationId: string, notes = "") => {
    try {
      const { error } = await supabase
        .from("user_validations")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          reviewer_notes: notes,
        })
        .eq("id", validationId)

      if (error) throw error

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_id: user?.id,
        action_type: "validation_approved",
        target_type: "validation",
        target_id: validationId,
        details: { notes },
        reason: "Validation approved by admin",
      })

      loadValidations()
    } catch (error) {
      console.error("Error approving validation:", error)
    }
  }

  const handleReject = async (validationId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from("user_validations")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          rejection_reason: reason,
        })
        .eq("id", validationId)

      if (error) throw error

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_id: user?.id,
        action_type: "validation_rejected",
        target_type: "validation",
        target_id: validationId,
        details: { reason },
        reason: "Validation rejected by admin",
      })

      loadValidations()
    } catch (error) {
      console.error("Error rejecting validation:", error)
    }
  }

  if (loading) {
    return <div className="container py-8">Carregando validações...</div>
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Validações de Usuários</h1>
          <p className="text-muted-foreground">Revisar e aprovar candidatos a mentor e mentee</p>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending">Pendentes ({validations.length})</TabsTrigger>
            <TabsTrigger value="approved">Aprovadas</TabsTrigger>
            <TabsTrigger value="rejected">Rejeitadas</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {validations.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-48">
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma validação pendente</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {validations.map((validation) => (
                  <Card key={validation.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={validation.user_profile?.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>
                              {validation.user_profile?.first_name?.[0]}
                              {validation.user_profile?.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-xl">
                              {validation.user_profile?.first_name} {validation.user_profile?.last_name}
                            </CardTitle>
                            <CardDescription>{validation.user_profile?.email}</CardDescription>
                            <p className="text-sm text-muted-foreground">{validation.user_profile?.location}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {validation.user_type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Enviado em {new Date(validation.submitted_at).toLocaleDateString("pt-BR")}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{validation.user_profile?.email}</span>
                          </div>
                        </div>

                        {validation.user_profile?.bio && (
                          <div>
                            <Label className="text-sm font-medium">Biografia</Label>
                            <p className="text-sm text-muted-foreground mt-1">{validation.user_profile.bio}</p>
                          </div>
                        )}

                        <div className="flex gap-2 flex-wrap">
                          {validation.youtube_video_url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={validation.youtube_video_url} target="_blank" rel="noopener noreferrer">
                                <Play className="h-4 w-4 mr-2" />
                                Ver Vídeo
                              </a>
                            </Button>
                          )}

                          {validation.user_profile?.linkedin_url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={validation.user_profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                LinkedIn
                              </a>
                            </Button>
                          )}

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Detalhes da Validação</DialogTitle>
                                <DialogDescription>Informações completas do candidato</DialogDescription>
                              </DialogHeader>
                              <ValidationDetails validation={validation} />
                            </DialogContent>
                          </Dialog>

                          <Button
                            size="sm"
                            onClick={() =>
                              handleApprove(validation.id, `Aprovado em ${new Date().toLocaleDateString("pt-BR")}`)
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aprovar
                          </Button>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <XCircle className="h-4 w-4 mr-2" />
                                Rejeitar
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Rejeitar Validação</DialogTitle>
                                <DialogDescription>Forneça um motivo para a rejeição</DialogDescription>
                              </DialogHeader>
                              <RejectForm onReject={(reason) => handleReject(validation.id, reason)} />
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved">
            <Card>
              <CardContent className="flex items-center justify-center h-48">
                <p className="text-muted-foreground">Validações aprovadas aparecerão aqui</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected">
            <Card>
              <CardContent className="flex items-center justify-center h-48">
                <p className="text-muted-foreground">Validações rejeitadas aparecerão aqui</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function ValidationDetails({ validation }: { validation: Validation }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Nome</Label>
          <p className="text-sm">
            {validation.user_profile?.first_name} {validation.user_profile?.last_name}
          </p>
        </div>
        <div>
          <Label className="text-sm font-medium">Email</Label>
          <p className="text-sm">{validation.user_profile?.email}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Tipo</Label>
          <p className="text-sm capitalize">{validation.user_type}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Localização</Label>
          <p className="text-sm">{validation.user_profile?.location || "Não informado"}</p>
        </div>
      </div>

      {validation.user_profile?.bio && (
        <div>
          <Label className="text-sm font-medium">Biografia</Label>
          <p className="text-sm">{validation.user_profile.bio}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-medium">Links</Label>
        <div className="space-y-1">
          {validation.youtube_video_url && (
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              <a
                href={validation.youtube_video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Vídeo de Apresentação
              </a>
            </div>
          )}
          {validation.user_profile?.linkedin_url && (
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              <a
                href={validation.user_profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Perfil LinkedIn
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RejectForm({ onReject }: { onReject: (reason: string) => void }) {
  const [reason, setReason] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (reason.trim()) {
      onReject(reason)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="reason">Motivo da rejeição</Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Descreva o motivo da rejeição..."
          required
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">
          Cancelar
        </Button>
        <Button type="submit" variant="destructive">
          Rejeitar Candidatura
        </Button>
      </div>
    </form>
  )
}
