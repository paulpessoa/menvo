"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CheckCircle, XCircle, Clock, MessageSquare } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/hooks/useAuth"
import { useVolunteerActivities, useValidateActivity } from "@/hooks/api/use-volunteer-activities"

export default function AdminVoluntariosPage() {
  const { user } = useAuth()
  const [validationNotes, setValidationNotes] = useState("")
  const [selectedActivity, setSelectedActivity] = useState<any>(null)

  const validateActivity = useValidateActivity()

  // Fetch pending activities for validation
  const { data: activities, isLoading, refetch } = useVolunteerActivities({ status: "pending" })

  // Check if user has admin/moderator permissions
  if (!user || (user.role !== "admin" && user.role !== "moderator")) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Acesso Restrito</h3>
              <p className="text-muted-foreground">Esta área é restrita a administradores e moderadores.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleValidation = async (activityId: string, status: "validated" | "rejected") => {
    try {
      await validateActivity.mutateAsync({
        activityId,
        status,
        notes: validationNotes,
      })
      setValidationNotes("")
      setSelectedActivity(null)
    } catch (error) {
      console.error("Erro ao validar atividade:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Validação de Atividades Voluntárias
            </CardTitle>
            <CardDescription>Atividades pendentes de validação por administradores e moderadores</CardDescription>
          </CardHeader>
          <CardContent>
            {activities && activities.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Voluntário</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Horas</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">
                            {activity.user?.full_name?.[0] || "?"}
                          </div>
                          <span className="font-medium">{activity.user?.full_name || "Usuário"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{activity.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{activity.activity_type}</Badge>
                      </TableCell>
                      <TableCell>{format(new Date(activity.date), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{activity.hours}h</TableCell>
                      <TableCell className="max-w-xs">
                        {activity.description ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Ver descrição
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Descrição da Atividade</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium mb-2">Título:</h4>
                                  <p>{activity.title}</p>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Descrição:</h4>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {activity.description}
                                  </p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sem descrição</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => setSelectedActivity(activity)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aprovar
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Aprovar Atividade</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <p>
                                    <strong>Título:</strong> {activity.title}
                                  </p>
                                  <p>
                                    <strong>Voluntário:</strong> {activity.user?.full_name}
                                  </p>
                                  <p>
                                    <strong>Horas:</strong> {activity.hours}h
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Notas (opcional):</label>
                                  <Textarea
                                    value={validationNotes}
                                    onChange={(e) => setValidationNotes(e.target.value)}
                                    placeholder="Adicione comentários sobre a validação..."
                                    rows={3}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleValidation(activity.id, "validated")}
                                    disabled={validateActivity.isPending}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    {validateActivity.isPending ? "Aprovando..." : "Confirmar Aprovação"}
                                  </Button>
                                  <Button variant="outline" onClick={() => setSelectedActivity(null)}>
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="destructive" onClick={() => setSelectedActivity(activity)}>
                                <XCircle className="h-4 w-4 mr-1" />
                                Rejeitar
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Rejeitar Atividade</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <p>
                                    <strong>Título:</strong> {activity.title}
                                  </p>
                                  <p>
                                    <strong>Voluntário:</strong> {activity.user?.full_name}
                                  </p>
                                  <p>
                                    <strong>Horas:</strong> {activity.hours}h
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Motivo da rejeição:</label>
                                  <Textarea
                                    value={validationNotes}
                                    onChange={(e) => setValidationNotes(e.target.value)}
                                    placeholder="Explique o motivo da rejeição..."
                                    rows={3}
                                    required
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleValidation(activity.id, "rejected")}
                                    disabled={validateActivity.isPending || !validationNotes.trim()}
                                  >
                                    {validateActivity.isPending ? "Rejeitando..." : "Confirmar Rejeição"}
                                  </Button>
                                  <Button variant="outline" onClick={() => setSelectedActivity(null)}>
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma atividade pendente</h3>
                <p className="text-muted-foreground">
                  Todas as atividades foram validadas ou não há atividades para revisar.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
