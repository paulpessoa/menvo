"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/utils/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, MessageSquare, CheckCircle, XCircle, Clock, Edit2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface Feedback {
  id: string
  rating: number
  comment: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  rejection_reason: string | null
  mentee: {
    full_name: string | null
    email: string | null
  } | null
  mentor?: {
    full_name: string | null
  } | null
}

export function FeedbackManagement({ type }: { type: 'received' | 'sent' }) {
  const [feedbacks, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null)
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const supabase = createClient()
  const { toast } = useToast()

  const fetchFeedbacks = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      let query = supabase.from("appointment_feedbacks").select(`
        id, rating, comment, status, created_at, rejection_reason,
        mentee:profiles!reviewer_id(full_name, email),
        mentor:profiles!reviewed_id(full_name)
      `)

      if (type === 'received') {
        query = query.eq('reviewed_id', user.id)
      } else {
        query = query.eq('reviewer_id', user.id)
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      setFeedback((data as any[]) || [])
    } catch (err) {
      console.error("Error fetching feedbacks:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedbacks()
  }, [type])

  const handleEdit = (fb: Feedback) => {
    setEditingFeedback(fb)
    setNewComment(fb.comment || "")
  }

  const saveEdit = async () => {
    if (!editingFeedback) return
    setIsSubmitting(true)

    try {
      const { error } = await (supabase
        .from("appointment_feedbacks") as any)
        .update({ 
          public_feedback: newComment,
          status: 'pending', // Volta para análise após editar
          updated_at: new Date().toISOString()
        })
        .eq('id', editingFeedback.id)

      if (error) throw error

      toast({ title: "Avaliação atualizada!", description: "Sua edição foi enviada para análise." })
      setEditingFeedback(null)
      fetchFeedbacks()
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none"><CheckCircle className="w-3 h-3 mr-1" /> Público</Badge>
      case 'rejected': return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none"><XCircle className="w-3 h-3 mr-1" /> Rejeitado</Badge>
      default: return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none"><Clock className="w-3 h-3 mr-1" /> Em Análise</Badge>
    }
  }

  if (loading) return <div className="py-10 text-center text-muted-foreground italic">Carregando avaliações...</div>

  return (
    <div className="space-y-4">
      {feedbacks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50/50 rounded-xl border border-dashed">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 italic">Nenhuma avaliação encontrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {feedbacks.map((fb) => (
            <Card key={fb.id} className="overflow-hidden border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/5 rounded-xl">
                      <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <p className="font-bold">
                          {type === 'received' ? fb.mentee?.full_name : `Para: ${fb.mentor?.full_name}`}
                        </p>
                        {getStatusBadge(fb.status)}
                      </div>
                      <div className="flex gap-0.5 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < fb.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-200"}`} />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed italic">
                        "{fb.comment || "Sem comentário"}"
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-[11px] text-gray-400">
                      {format(new Date(fb.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                    {type === 'sent' && (fb.status === 'pending' || fb.status === 'rejected') && (
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(fb)} className="text-primary">
                        <Edit2 className="w-3 h-3 mr-2" /> Editar
                      </Button>
                    )}
                  </div>
                </div>

                {fb.status === 'rejected' && fb.rejection_reason && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                    <p className="text-xs font-bold text-red-600 uppercase mb-1">Motivo da Rejeição:</p>
                    <p className="text-sm text-red-800 italic">"{fb.rejection_reason}"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Edição */}
      <Dialog open={!!editingFeedback} onOpenChange={() => setEditingFeedback(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar sua avaliação</DialogTitle>
            <DialogDescription>
              Sua avaliação será enviada novamente para moderação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Seu comentário:</p>
              <Textarea 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={5}
                placeholder="Como foi sua mentoria?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingFeedback(null)}>Cancelar</Button>
            <Button onClick={saveEdit} disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar e Reenviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
