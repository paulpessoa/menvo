"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search,
  User,
  ArrowLeft,
  Filter
} from "lucide-react"
import Link from "next/link"
import { RequireRole } from "@/lib/auth/auth-guard"
import { mentorSuggestionService } from "@/lib/services/mentors/suggestions.service"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function AdminSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("pending")

  useEffect(() => {
    fetchSuggestions()
  }, [filter])

  const fetchSuggestions = async () => {
    setLoading(true)
    try {
      const data = await mentorSuggestionService.getAllSuggestions(filter === "all" ? undefined : filter)
      setSuggestions(data)
    } catch (error) {
      console.error("Error fetching suggestions:", error)
      toast.error("Erro ao carregar sugestões")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await mentorSuggestionService.updateSuggestionStatus(id, status)
      
      const statusMapping: Record<string, string> = {
        reviewing: "em análise",
        approved: "resolvida",
        rejected: "rejeitada"
      }
      const statusText = statusMapping[status] || status
      
      toast.success(`Sugestão marcada como ${statusText}`)
      fetchSuggestions()
    } catch (error) {
      toast.error("Erro ao atualizar status")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>
      case "reviewing": return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">Em Análise</Badge>
      case "approved": return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">Resolvida</Badge>
      case "rejected": return <Badge variant="destructive">Rejeitada</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <RequireRole roles={['admin']}>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild size="icon">
              <Link href="/admin"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <MessageSquare className="h-8 w-8 text-primary" />
                Sugestões de Temas
              </h1>
              <p className="text-muted-foreground">Gerencie o que os usuários estão procurando e não encontram</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
            <Button 
              variant={filter === "pending" ? "default" : "outline"} 
              onClick={() => setFilter("pending")}
              size="sm"
              className="rounded-full"
            >
              Pendentes
            </Button>
            <Button 
              variant={filter === "reviewing" ? "default" : "outline"} 
              onClick={() => setFilter("reviewing")}
              size="sm"
              className="rounded-full"
            >
              Em Análise
            </Button>
            <Button 
              variant={filter === "approved" ? "default" : "outline"} 
              onClick={() => setFilter("approved")}
              size="sm"
              className="rounded-full"
            >
              Resolvidas
            </Button>
            <Button 
              variant={filter === "rejected" ? "default" : "outline"} 
              onClick={() => setFilter("rejected")}
              size="sm"
              className="rounded-full"
            >
              Rejeitadas
            </Button>
            <Button 
              variant={filter === "all" ? "default" : "outline"} 
              onClick={() => setFilter("all")}
              size="sm"
              className="rounded-full"
            >
              Todas
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid gap-4">
              {suggestions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    Nenhuma sugestão encontrada para este filtro.
                  </CardContent>
                </Card>
              ) : (
                suggestions.map((s) => (
                  <Card key={s.id} className="overflow-hidden border-l-4 border-l-primary/30">
                    <CardHeader className="bg-muted/30 pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">
                            {s.first_name} {s.last_name}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(s.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        {getStatusBadge(s.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div>
                        <p className="text-sm font-semibold mb-1 text-primary/80 uppercase tracking-wider">O que o usuário busca:</p>
                        <p className="text-base bg-blue-50/50 p-4 rounded-md border border-blue-100 italic text-gray-800">
                          "{s.suggestion_text}"
                        </p>
                      </div>

                      {(s.free_topics?.length > 0 || s.inclusion_tags?.length > 0) && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">TAGS SUGERIDAS:</p>
                          <div className="flex flex-wrap gap-2">
                            {s.free_topics?.map((t: string) => (
                              <Badge key={t} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">{t}</Badge>
                            ))}
                            {s.inclusion_tags?.map((t: string) => (
                              <Badge key={t} variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">{t}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4 border-t">
                        {s.status === "pending" && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                            onClick={() => handleUpdateStatus(s.id, "reviewing")}
                          >
                            <Clock className="h-4 w-4 mr-1" /> Marcar em Análise
                          </Button>
                        )}
                        {(s.status === "pending" || s.status === "reviewing") && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                              onClick={() => handleUpdateStatus(s.id, "approved")}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Marcar como Resolvida
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                              onClick={() => handleUpdateStatus(s.id, "rejected")}
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Rejeitar
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </RequireRole>
  )
}
