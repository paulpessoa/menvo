"use client"

import { useState, useEffect, useMemo } from "react"
import { adminService } from "@/lib/services/admin/admin.service"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Star, Check, X, Clock, MessageCircle, User, Search } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AdminFeedback {
  id: string
  rating: number
  comment: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  mentee: { full_name: string | null, avatar_url: string | null } | null
  mentor: { full_name: string | null, avatar_url: string | null } | null
}

export function AdminFeedbackModeration() {
  const [feedbacks, setFeedbacks] = useState<AdminFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [ratingFilter, setRatingFilter] = useState("all")
  const { toast } = useToast()

  const filteredFeedbacks = useMemo(() => {
    const query = search.trim().toLowerCase()
    return feedbacks.filter((fb) => {
      const matchesSearch =
        !query ||
        (fb.mentee?.full_name || "").toLowerCase().includes(query) ||
        (fb.mentor?.full_name || "").toLowerCase().includes(query) ||
        (fb.comment || "").toLowerCase().includes(query)
      const matchesRating = ratingFilter === "all" || fb.rating === Number(ratingFilter)
      return matchesSearch && matchesRating
    })
  }, [feedbacks, search, ratingFilter])

  const fetchPendingFeedbacks = async () => {
    try {
      const data = await adminService.getPendingFeedbacks()
      setFeedbacks((data as unknown as AdminFeedback[]) || [])
    } catch (err) {
      console.error("Error fetching feedbacks:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingFeedbacks()
  }, [])

  const handleModeration = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await fetch('/api/admin/feedbacks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            feedbackId: id, 
            status: newStatus 
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao processar moderação")
      }

      toast({ 
        title: newStatus === 'approved' ? "Avaliação Aprovada!" : "Avaliação Rejeitada",
        description: newStatus === 'approved' ? "O mentor será notificado por e-mail." : "A avaliação não será exibida.",
        variant: newStatus === 'approved' ? "default" : "destructive"
      })
      
      fetchPendingFeedbacks()
    } catch (err: any) {
      toast({ title: "Erro na moderação", description: err.message, variant: "destructive" })
    }
  }

  if (loading) return <div className="py-20 text-center text-muted-foreground italic animate-pulse text-lg">Buscando avaliações pendentes...</div>

  return (
    <div className="space-y-6">
      {feedbacks.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por mentor, mentorado ou comentário..."
              className="pl-9"
            />
          </div>
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Nota" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as notas</SelectItem>
              {[5, 4, 3, 2, 1].map((n) => (
                <SelectItem key={n} value={String(n)}>{n} estrela{n > 1 ? "s" : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {feedbacks.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <Check className="w-16 h-16 text-green-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900">Tudo limpo!</h3>
          <p className="text-gray-500 italic">Não há avaliações pendentes de moderação.</p>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          Nenhuma avaliação encontrada para esse filtro.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredFeedbacks.map((fb) => (
            <Card key={fb.id} className="overflow-hidden border-none shadow-sm bg-white hover:shadow-md transition-all">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Info Mentee (Autor) */}
                  <div className="p-6 md:w-1/3 bg-gray-50/50 border-r border-gray-100 flex flex-col items-center justify-center text-center space-y-3">
                    <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                      <AvatarImage src={fb.mentee?.avatar_url || undefined} />
                      <AvatarFallback>{fb.mentee?.full_name?.[0] || 'A'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-black text-gray-900">{fb.mentee?.full_name}</p>
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mt-1">Mentorado (Autor)</p>
                    </div>
                  </div>

                  {/* Feedback Content */}
                  <div className="p-8 flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-5 h-5 ${i < fb.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                          ))}
                       </div>
                       <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-tighter">
                         {format(new Date(fb.created_at), "dd MMM yyyy", { locale: ptBR })}
                       </span>
                    </div>

                    <blockquote className="text-xl text-gray-700 font-medium leading-relaxed">
                      "{fb.comment || "Sem comentário disponível."}"
                    </blockquote>

                    <div className="flex items-center gap-2 pt-2">
                       <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-500" />
                       </div>
                       <p className="text-sm text-gray-500 italic">Para o mentor: <span className="font-bold text-gray-700 not-italic">{fb.mentor?.full_name}</span></p>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="p-6 md:w-48 border-l border-gray-100 flex flex-col justify-center gap-3 bg-gray-50/20">
                    <Button 
                      onClick={() => handleModeration(fb.id, 'approved')} 
                      className="w-full bg-primary hover:bg-primary/90 text-white font-bold"
                    >
                      <Check className="w-4 h-4 mr-2" /> Aprovar
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleModeration(fb.id, 'rejected')}
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 font-bold"
                    >
                      <X className="w-4 h-4 mr-2" /> Rejeitar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
