"use client"

import { useQuery } from "@tanstack/react-query"
import { Loader2, Star, User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PlatformFeedback {
  id: string
  rating: number
  comment: string | null
  email: string | null
  source: string
  created_at: string
  user: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

export function AdminPlatformFeedback() {
  const { data, isLoading, error } = useQuery<{ data: { feedback: PlatformFeedback[] } }>({
    queryKey: ["platform-feedback"],
    queryFn: async () => {
      const res = await fetch("/api/feedback?limit=50")
      if (!res.ok) throw new Error("Erro ao carregar feedbacks")
      return res.json()
    }
  })

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">Erro ao carregar feedbacks.</div>
  }

  const feedbacks = data?.data?.feedback || []

  if (feedbacks.length === 0) {
    return <div className="text-center text-muted-foreground p-8">Nenhum feedback encontrado.</div>
  }

  return (
    <div className="space-y-4">
      {feedbacks.map((item) => (
        <Card key={item.id}>
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-full">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {item.user?.full_name || item.email || "Usuário Anônimo"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < item.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                  />
                ))}
              </div>
            </div>
            {item.comment && (
              <p className="text-sm mt-2 p-3 bg-muted/30 rounded-md">
                {item.comment}
              </p>
            )}
            <div className="flex justify-end mt-1">
              <Badge variant="outline" className="text-[10px]">
                {item.source}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
