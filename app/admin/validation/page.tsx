"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, Clock, User, Briefcase, MapPin } from 'lucide-react'
import { toast } from "sonner"

interface ValidationRequest {
  id: string
  user_id: string
  profile_data: {
    name: string
    email: string
    bio: string
    role: "mentor" | "mentee"
    location?: string
  }
  status: "pending" | "approved" | "rejected"
  created_at: string
  review_notes?: string
}

export default function ValidationPage() {
  const [requests, setRequests] = useState<ValidationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<ValidationRequest | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchValidationRequests()
  }, [])

  const fetchValidationRequests = async () => {
    try {
      const response = await fetch("/api/admin/validation-requests")
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
      }
    } catch (error) {
      console.error("Erro ao buscar solicitações:", error)
      toast.error("Erro ao carregar solicitações")
    } finally {
      setLoading(false)
    }
  }

  const handleValidation = async (requestId: string, action: "approve" | "reject") => {
    if (!selectedRequest) return

    setProcessing(true)
    try {
      const response = await fetch("/api/admin/validation-requests", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request_id: requestId,
          action,
          review_notes: reviewNotes,
        }),
      })

      if (response.ok) {
        toast.success(`Perfil ${action === "approve" ? "aprovado" : "rejeitado"} com sucesso`)
        setSelectedRequest(null)
        setReviewNotes("")
        fetchValidationRequests()
      } else {
        throw new Error("Erro na validação")
      }
    } catch (error) {
      console.error("Erro na validação:", error)
      toast.error("Erro ao processar validação")
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>
      case "approved":
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>
      case "rejected":
        return <Badge variant="outline" className="text-red-600"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const pendingRequests = requests.filter(r => r.status === "pending")
  const processedRequests = requests.filter(r => r.status !== "pending")

  if (loading) {
    return <div className="p-6">Carregando...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Validação de Perfis</h1>
        <p className="text-muted-foreground">
          Revise e aprove novos perfis de mentores e mentees
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">
            Pendentes ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="processed">
            Processados ({processedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Nenhuma solicitação pendente</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingRequests.map((request) => (
                <Card key={request.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {request.profile_data.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{request.profile_data.name}</CardTitle>
                          <CardDescription>{request.profile_data.email}</CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm">
                      {request.profile_data.role === "mentor" ? (
                        <Briefcase className="h-4 w-4 text-green-600" />
                      ) : (
                        <User className="h-4 w-4 text-blue-600" />
                      )}
                      <span className="capitalize">{request.profile_data.role}</span>
                    </div>
                    
                    {request.profile_data.location && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{request.profile_data.location}</span>
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {request.profile_data.bio}
                    </p>

                    <div className="flex space-x-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                        variant="outline"
                        className="flex-1"
                      >
                        Revisar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="processed" className="space-y-4">
          {processedRequests.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Nenhuma solicitação processada</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {processedRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {request.profile_data.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{request.profile_data.name}</h3>
                          <p className="text-sm text-muted-foreground">{request.profile_data.email}</p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    {request.review_notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm"><strong>Notas:</strong> {request.review_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Revisão */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Revisar Perfil</CardTitle>
              <CardDescription>
                Analise as informações e aprove ou rejeite o perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {selectedRequest.profile_data.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedRequest.profile_data.name}</h3>
                  <p className="text-muted-foreground">{selectedRequest.profile_data.email}</p>
                  <Badge variant="outline" className="mt-1">
                    {selectedRequest.profile_data.role === "mentor" ? (
                      <><Briefcase className="h-3 w-3 mr-1" />Mentor</>
                    ) : (
                      <><User className="h-3 w-3 mr-1" />Mentee</>
                    )}
                  </Badge>
                </div>
              </div>

              {selectedRequest.profile_data.location && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedRequest.profile_data.location}</span>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Biografia:</h4>
                <p className="text-sm bg-gray-50 p-3 rounded-lg">
                  {selectedRequest.profile_data.bio}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Notas da Revisão (opcional):
                </label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Adicione comentários sobre a aprovação/rejeição..."
                  rows={3}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={() => handleValidation(selectedRequest.id, "approve")}
                  disabled={processing}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
                <Button
                  onClick={() => handleValidation(selectedRequest.id, "reject")}
                  disabled={processing}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
                <Button
                  onClick={() => {
                    setSelectedRequest(null)
                    setReviewNotes("")
                  }}
                  variant="outline"
                  disabled={processing}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
