"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, ExternalLink, Play } from "lucide-react"
import { RequireAdmin } from "@/lib/auth"
import { createClient } from "@/utils/supabase/client"
import type { Database } from "@/types/database"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export default function AdminVerifications() {
  const [pendingMentors, setPendingMentors] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchPendingMentors()
  }, [])

  const fetchPendingMentors = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "mentor")
        .eq("verification_status", "pending")
        .order("created_at", { ascending: true })

      if (error) throw error
      setPendingMentors(data || [])
    } catch (error) {
      console.error("Error fetching pending mentors:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerification = async (mentorId: string, status: "approved" | "rejected", notes?: string) => {
    setProcessingId(mentorId)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          verification_status: status,
          verification_notes: notes,
          verified_at: status === "approved" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", mentorId)

      if (error) throw error

      // Remover da lista local
      setPendingMentors((prev) => prev.filter((mentor) => mentor.id !== mentorId))

      // TODO: Enviar email de notificação
    } catch (error) {
      console.error("Error updating verification status:", error)
    } finally {
      setProcessingId(null)
    }
  }

  const getYouTubeVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <RequireAdmin>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Verificações Pendentes</h1>
            <p className="text-muted-foreground">
              Revise e aprove mentores aguardando verificação ({pendingMentors.length} pendentes)
            </p>
          </div>

          {pendingMentors.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma verificação pendente</h3>
                <p className="text-muted-foreground text-center">
                  Todas as solicitações de mentores foram processadas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {pendingMentors.map((mentor) => (
                <Card key={mentor.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={mentor.avatar_url || ""} />
                          <AvatarFallback className="text-lg">{mentor.full_name?.charAt(0) || "M"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-xl">{mentor.full_name}</CardTitle>
                          <CardDescription className="text-base">{mentor.email}</CardDescription>
                          <Badge variant="outline" className="mt-2">
                            Cadastrado em {new Date(mentor.created_at!).toLocaleDateString("pt-BR")}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Bio */}
                    <div>
                      <Label className="text-sm font-semibold">Biografia</Label>
                      <p className="mt-1 text-sm text-muted-foreground">{mentor.bio || "Não informado"}</p>
                    </div>

                    {/* Expertise Areas */}
                    <div>
                      <Label className="text-sm font-semibold">Áreas de Expertise</Label>
                      <p className="mt-1 text-sm text-muted-foreground">{mentor.expertise_areas || "Não informado"}</p>
                    </div>

                    {/* LinkedIn */}
                    {mentor.linkedin_url && (
                      <div>
                        <Label className="text-sm font-semibold">LinkedIn</Label>
                        <div className="mt-1">
                          <Button variant="outline" size="sm" asChild>
                            <a href={mentor.linkedin_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Ver Perfil
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Presentation Video */}
                    {mentor.presentation_video_url && (
                      <div>
                        <Label className="text-sm font-semibold">Vídeo de Apresentação</Label>
                        <div className="mt-2 space-y-2">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <a href={mentor.presentation_video_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Abrir no YouTube
                              </a>
                            </Button>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Play className="h-4 w-4 mr-2" />
                                  Assistir Aqui
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle>Vídeo de Apresentação - {mentor.full_name}</DialogTitle>
                                </DialogHeader>
                                <div className="aspect-video">
                                  {getYouTubeVideoId(mentor.presentation_video_url) ? (
                                    <iframe
                                      width="100%"
                                      height="100%"
                                      src={`https://www.youtube.com/embed/${getYouTubeVideoId(mentor.presentation_video_url)}`}
                                      title="Vídeo de apresentação"
                                      frameBorder="0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center h-full bg-muted">
                                      <p>URL de vídeo inválida</p>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                      <div className="flex-1">
                        <Label htmlFor={`notes-${mentor.id}`} className="text-sm font-semibold">
                          Notas da Verificação (opcional)
                        </Label>
                        <Textarea
                          id={`notes-${mentor.id}`}
                          placeholder="Adicione observações sobre a verificação..."
                          className="mt-1"
                        />
                      </div>

                      <div className="flex flex-col gap-2 sm:w-48">
                        <Button
                          onClick={() => {
                            const textarea = document.getElementById(`notes-${mentor.id}`) as HTMLTextAreaElement
                            handleVerification(mentor.id, "approved", textarea?.value)
                          }}
                          disabled={processingId === mentor.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {processingId === mentor.id ? "Processando..." : "Aprovar"}
                        </Button>

                        <Button
                          variant="destructive"
                          onClick={() => {
                            const textarea = document.getElementById(`notes-${mentor.id}`) as HTMLTextAreaElement
                            handleVerification(mentor.id, "rejected", textarea?.value)
                          }}
                          disabled={processingId === mentor.id}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {processingId === mentor.id ? "Processando..." : "Rejeitar"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </RequireAdmin>
  )
}
