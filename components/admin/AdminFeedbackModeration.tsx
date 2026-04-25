"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/utils/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Check, X, Clock, MessageCircle, User } from "lucide-react"
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
  const supabase = createClient()
  const { toast } = useToast()

  const fetchPendingFeedbacks = async () => {
    try {
      const { data, error } = await supabase
        .from("appointment_feedbacks")
        .select(`
          id, rating, comment, status, created_at,
          mentee:profiles!reviewer_id(full_name, avatar_url),
          mentor:profiles!reviewed_id(full_name, avatar_url)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

      if (error) throw error
      setFeedbacks((data as any[]) || [])
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
      {feedbacks.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <Check className="w-16 h-16 text-green-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900">Tudo limpo!</h3>
          <p className="text-gray-500 italic">Não há avaliações pendentes de moderação.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {feedbacks.map((fb) => (
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
                      className="w-full bg-green-600 hover:bg-green-700 font-bold"
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
