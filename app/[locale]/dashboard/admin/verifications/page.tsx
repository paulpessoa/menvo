"use client"

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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, User, CheckCircle, XCircle, Eye, Loader2, ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { VerificationService } from "@/lib/services/verifications/verifications.service"
import type { Verification } from "@/lib/types/models/verification"
import { toast } from "sonner"
import { Link } from "@/i18n/routing"

export default function AdminVerificationsPage() {
  const { user } = useAuth()
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [loading, setLoading] = useState(true)

  const loadVerifications = useCallback(async () => {
    try {
      if (user?.id) {
        const data = await VerificationService.getPendingVerifications(user.id)
        setVerifications(data)
      }
    } catch (error) {
      console.error("Error loading verifications:", error)
      toast.error("Erro ao carregar verificações pendentes")
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadVerifications()
  }, [loadVerifications])

  const handleApprove = async (verificationId: string) => {
    try {
      await VerificationService.completeVerification({
        verificationId,
        adminId: user!.id,
        passed: true,
        notes: "Verification completed successfully by admin",
      })
      toast.success("Mentor aprovado com sucesso!")
      loadVerifications()
    } catch (error) {
      console.error("Error approving verification:", error)
      toast.error("Erro ao aprovar mentor")
    }
  }

  const handleReject = async (verificationId: string, reason: string) => {
    try {
      await VerificationService.completeVerification({
        verificationId,
        adminId: user!.id,
        passed: false,
        notes: reason,
      })
      toast.success("Aplicação rejeitada.")
      loadVerifications()
    } catch (error) {
      console.error("Error rejecting verification:", error)
      toast.error("Erro ao rejeitar mentor")
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground">Carregando verificações de mentores...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 md:py-12 max-w-6xl">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground">
                <Link href="/dashboard/admin">
                  <ArrowLeft className="h-4 w-4" />
                  Painel Admin
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Verificações de Mentores</h1>
            <p className="text-muted-foreground">Analise, valide e aprove solicitações de credenciamento de mentores</p>
          </div>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="pending">Pendentes ({verifications.length})</TabsTrigger>
            <TabsTrigger value="scheduled">Agendados</TabsTrigger>
            <TabsTrigger value="completed">Concluídos</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {verifications.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-56">
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                    <p className="font-medium text-gray-700">Nenhuma verificação pendente</p>
                    <p className="text-sm text-muted-foreground">Todas as solicitações de mentores estão em dia.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {verifications.map((verification) => (
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
                      <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-6">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>Inscrito em {new Date(verification.created_at).toLocaleDateString("pt-BR")}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="h-4 w-4" />
                          <span>{verification.mentor_email}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-xl">
                            <DialogHeader>
                              <DialogTitle>Detalhes da Verificação</DialogTitle>
                              <DialogDescription>Dados cadastrais e documentos do mentor</DialogDescription>
                            </DialogHeader>
                            <VerificationDetails verification={verification} />
                          </DialogContent>
                        </Dialog>

                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(verification.id)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aprovar Mentor
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
                              <DialogTitle>Rejeitar Verificação</DialogTitle>
                              <DialogDescription>Por favor, informe a justificativa da recusa</DialogDescription>
                            </DialogHeader>
                            <RejectForm onReject={(reason: string) => handleReject(verification.id, reason)} />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="scheduled">
            <Card>
              <CardContent className="flex items-center justify-center h-48">
                <p className="text-muted-foreground">Verificações agendadas aparecerão aqui.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardContent className="flex items-center justify-center h-48">
                <p className="text-muted-foreground">Verificações concluídas aparecerão aqui.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
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

      <div className="border-t pt-4">
        <Label className="text-xs text-muted-foreground uppercase font-semibold">Documentação & Redes</Label>
        <div className="mt-3 space-y-2.5">
          <div className="flex items-center space-x-2">
            <Checkbox id="resume" defaultChecked disabled />
            <Label htmlFor="resume" className="text-sm cursor-pointer">
              Currículo / Trajetória Profissional
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="linkedin" defaultChecked disabled />
            <Label htmlFor="linkedin" className="text-sm cursor-pointer">
              Perfil LinkedIn Validado
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
