"use client"

import { MenvoDots } from "@/components/ui/menvo-loader"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Search } from "lucide-react"
import { useAuth } from "@/lib/auth"
import type { VerificationStatus } from "@/lib/services/verifications/notification.service"
import type { Verification } from "@/lib/types/models/verification"
import { toast } from "sonner"
import { PageContainer } from "@/components/layout/PageContainer"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { MentorReviewAssistant } from "@/components/admin/MentorReviewAssistant"

export default function AdminVerificationsPage() {
  const { user } = useAuth()
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [areaFilter, setAreaFilter] = useState("all")

  const [activeTab, setActiveTab] = useState("pending")

  const loadVerifications = useCallback(async (status: string) => {
    try {
      if (user?.id) {
        setLoading(true)
        const response = await fetch(`/api/admin/verifications/${status}`)
        if (!response.ok) throw new Error("Erro ao carregar verificações")
        const { verifications: data } = await response.json()
        setVerifications(data || [])
      }
    } catch (error) {
      console.error("Error loading verifications:", error)
      toast.error("Erro ao carregar verificações")
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadVerifications(activeTab)
  }, [loadVerifications, activeTab])

  const submitVerification = async (
    userId: string,
    status: VerificationStatus,
    notes?: string,
    message?: string
  ) => {
    const response = await fetch("/api/admin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, status, notes, message })
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error || "Erro ao processar verificação")
    }
  }

  const handleApprove = async (verificationId: string, message?: string) => {
    try {
      // Goes through /api/admin/verify (service-role, requireAdmin-guarded)
      // rather than the client-side VerificationService: approving a
      // mentor request also has to assign the "mentor" role in user_roles
      // for a DIFFERENT user than the admin, which needs a service-role
      // write - see processVerification in notification.service.ts.
      await submitVerification(verificationId, "approved", undefined, message)
      toast.success("Mentor aprovado com sucesso!")
      loadVerifications(activeTab)
    } catch (error) {
      console.error("Error approving verification:", error)
      toast.error("Erro ao aprovar mentor")
      throw error
    }
  }

  const handleReject = async (verificationId: string, reason: string, message?: string) => {
    try {
      await submitVerification(verificationId, "rejected", reason, message)
      toast.success("Aplicação rejeitada.")
      loadVerifications(activeTab)
    } catch (error) {
      console.error("Error rejecting verification:", error)
      toast.error("Erro ao rejeitar mentor")
      throw error
    }
  }

  const expertiseAreas = Array.from(
    new Set(verifications.flatMap((v) => v.mentor_expertise_areas || []))
  ).sort()

  const filteredVerifications = verifications.filter((v) => {
    const query = search.trim().toLowerCase()
    const matchesSearch =
      !query ||
      v.mentor_name.toLowerCase().includes(query) ||
      v.mentor_email.toLowerCase().includes(query) ||
      (v.mentor_company || "").toLowerCase().includes(query)
    const matchesArea =
      areaFilter === "all" || (v.mentor_expertise_areas || []).includes(areaFilter)
    return matchesSearch && matchesArea
  })

  if (loading) {
    return (
      <PageContainer className="flex flex-col items-center justify-center min-h-[400px]">
        <MenvoDots className="mb-3" />
        <p className="text-muted-foreground">Carregando verificações de mentores...</p>
      </PageContainer>
    )
  }

  const renderList = () => (
    <div className="space-y-4 mt-4">
      {verifications.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, e-mail ou empresa..."
              className="pl-9"
            />
          </div>
          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Área de atuação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as áreas</SelectItem>
              {expertiseAreas.map((area) => (
                <SelectItem key={area} value={area}>{area}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {verifications.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-56">
            <div className="text-center">
              <p className="font-medium text-gray-700">Nenhuma verificação encontrada</p>
              <p className="text-sm text-muted-foreground">Tudo em dia por aqui.</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredVerifications.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Nenhuma verificação encontrada para esse filtro.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredVerifications.map((verification) => (
            <Card key={verification.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {verification.mentor_name
                          .split(" ")
                          .map((n: string) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl">{verification.mentor_name}</CardTitle>
                      <CardDescription className="font-medium text-gray-600">{verification.mentor_title}</CardDescription>
                      <p className="text-sm text-muted-foreground">{verification.mentor_company || "Empresa não informada"}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="w-fit">{verification.verification_type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground mb-6">
                  <span>Inscrito em {new Date(verification.created_at).toLocaleDateString("pt-BR")}</span>
                  <span>{verification.mentor_email}</span>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Detalhes da Verificação</DialogTitle>
                        <DialogDescription>Dados cadastrais e documentos do mentor</DialogDescription>
                      </DialogHeader>
                      <VerificationDetails verification={verification} />
                    </DialogContent>
                  </Dialog>

                  {activeTab === "pending" && (
                    <>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-medium">
                            Aprovar Mentor
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Aprovar solicitação de mentor?</AlertDialogTitle>
                            <AlertDialogDescription>
                              O usuário será notificado por e-mail, receberá acesso ao painel de mentores e seu perfil será publicado na plataforma. Tem certeza que deseja prosseguir?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleApprove(verification.id)}>
                              Sim, Aprovar Mentor
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <MentorReviewAssistant
                        userId={verification.id}
                        onApprove={(message) => handleApprove(verification.id, message)}
                        onReject={(message) => handleReject(verification.id, "Ajustes solicitados via assistente de IA", message)}
                      />

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            Rejeitar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Rejeitar Verificação</DialogTitle>
                            <DialogDescription>Por favor, informe a justificativa da recusa</DialogDescription>
                          </DialogHeader>
                          <RejectForm onReject={(reason: string) => handleReject(verification.id, reason)} />
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                  {activeTab === "completed" && (
                    <Badge variant={verification.status === "approved" ? "default" : "destructive"}>
                      {verification.status === "approved" ? "Aprovado" : "Rejeitado"}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <PageContainer>
      <AdminPageHeader
        title="Verificação de mentores"
        description="Analise, valide e aprove as candidaturas de mentores."
      />
      <div className="flex flex-col space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="pending">Pendentes ({verifications.length})</TabsTrigger>
            <TabsTrigger value="scheduled">Agendados</TabsTrigger>
            <TabsTrigger value="completed">Concluídos</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {renderList()}
          </TabsContent>

          <TabsContent value="scheduled">
            <Card>
              <CardContent className="flex items-center justify-center h-48">
                <p className="text-muted-foreground">Verificações agendadas aparecerão aqui.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            {renderList()}
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  )
}

function VerificationDetails({ verification }: { verification: Verification }) {
  return (
    <div className="space-y-6 pt-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs text-muted-foreground uppercase font-semibold">Nome Completo</Label>
          <p className="text-sm font-medium mt-0.5">{verification.mentor_name}</p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground uppercase font-semibold">Email</Label>
          <p className="text-sm font-medium mt-0.5">{verification.mentor_email}</p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground uppercase font-semibold">Cargo / Título</Label>
          <p className="text-sm font-medium mt-0.5">{verification.mentor_title}</p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground uppercase font-semibold">Empresa / Organização</Label>
          <p className="text-sm font-medium mt-0.5">{verification.mentor_company || "-"}</p>
        </div>
      </div>

      {(verification.mentorship_approach || verification.what_to_expect) && (
        <div className="border-t pt-4">
          <Label className="text-xs text-muted-foreground uppercase font-semibold">Abordagem de Mentoria</Label>
          <div className="mt-3 space-y-3">
            {verification.mentorship_approach && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Como pretende conduzir as mentorias:</p>
                <p className="text-sm whitespace-pre-wrap">{verification.mentorship_approach}</p>
              </div>
            )}
            {verification.what_to_expect && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">O que espera do mentorado:</p>
                <p className="text-sm whitespace-pre-wrap">{verification.what_to_expect}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {verification.mentor_bio && (
        <div className="border-t pt-4">
          <Label className="text-xs text-muted-foreground uppercase font-semibold">Bio</Label>
          <p className="text-sm mt-1 whitespace-pre-wrap">{verification.mentor_bio}</p>
        </div>
      )}

      {verification.mentor_expertise_areas && verification.mentor_expertise_areas.length > 0 && (
        <div className="border-t pt-4">
          <Label className="text-xs text-muted-foreground uppercase font-semibold">Especialidades</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {verification.mentor_expertise_areas.map((area) => (
              <Badge key={area} variant="secondary" className="font-normal">{area}</Badge>
            ))}
          </div>
        </div>
      )}

      <div className="border-t pt-4">
        <Label className="text-xs text-muted-foreground uppercase font-semibold">Documentação & Redes</Label>
        <div className="mt-3 space-y-2.5">
          <div className="flex items-center space-x-2">
            <Checkbox id="resume" checked={Boolean(verification.cv_url)} disabled />
            <Label htmlFor="resume" className="text-sm cursor-pointer">
              {verification.cv_url ? (
                <a href={verification.cv_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Currículo enviado - ver PDF
                </a>
              ) : (
                "Currículo não enviado"
              )}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="linkedin" checked={Boolean(verification.linkedin_url)} disabled />
            <Label htmlFor="linkedin" className="text-sm cursor-pointer">
              {verification.linkedin_url ? (
                <a href={verification.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Ver perfil no LinkedIn
                </a>
              ) : (
                "LinkedIn não informado"
              )}
            </Label>
          </div>
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
      onReject(reason.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div>
        <Label htmlFor="reason">Motivo da recusa</Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explique o motivo para notificar o candidato (ex.: experiência insuficiente, perfil incompleto...)"
          className="mt-1 min-h-[100px]"
          required
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" variant="destructive">
          Confirmar Rejeição
        </Button>
      </div>
    </form>
  )
}
