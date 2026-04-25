"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, MessageCircle, User } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  mentee: {
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  } | null
}

export function MentorshipReviews({ mentorId }: { mentorId: string }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchReviews() {
      try {
        const { data, error } = await supabase
          .from("appointment_feedbacks")
          .select(`
            id,
            rating,
            comment,
            created_at,
            mentee:profiles!reviewer_id(first_name, last_name, avatar_url)
          `)
          .eq("reviewed_id", mentorId)
          .eq("status", "approved") // Apenas aprovados aparecem publicamente
          .order("created_at", { ascending: false })

        if (error) throw error
        setReviews((data as any[]) || [])
      } catch (err) {
        console.error("Error fetching reviews:", err)
      } finally {
        setLoading(false)
      }
    }

    if (mentorId) fetchReviews()
  }, [mentorId, supabase])

  if (loading) return null
  if (reviews.length === 0) return null

  return (
    <Card className="mt-8 border-none shadow-none bg-transparent">
      <CardHeader className="px-0">
        <CardTitle className="text-2xl flex items-center gap-2">
          <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
          Avaliações de Alunos ({reviews.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((review) => (
            <Card key={review.id} className="bg-white border-gray-100 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={review.mentee?.avatar_url || undefined} />
                    <AvatarFallback>
                      {review.mentee?.first_name?.[0] || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm">
                        {review.mentee?.first_name || "Aluno"}
                      </p>
                      <span className="text-[10px] text-gray-400">
                        {format(new Date(review.created_at), "MMM yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600 italic mt-2 leading-relaxed">
                        "{review.comment}"
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
