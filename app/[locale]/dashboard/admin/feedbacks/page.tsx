"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Star, Search, Loader2, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { createClient } from "@/lib/utils/supabase/client"
import { toast } from "sonner"
import { RequireRole } from "@/lib/auth/auth-guard"

export default function AdminFeedbacks() {
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [ratingFilter, setRatingFilter] = useState<string>("all")
  const supabase = createClient()

  useEffect(() => {
    fetchFeedbacks()
  }, [ratingFilter])

  const fetchFeedbacks = async () => {
    setLoading(true)
    try {
      // Tentativa de busca com join manual para evitar erro de cache do schema
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false })

      if (feedbackError) throw feedbackError

      if (feedbackData && feedbackData.length > 0) {
        // Buscar perfis separadamente para os feedbacks que possuem user_id
        const userIds = feedbackData.map(f => f.user_id).filter(Boolean)
        
        if (userIds.length > 0) {
            const { data: profileData } = await supabase
                .from("profiles")
                .select("id, first_name, last_name, email, avatar_url")
                .in("id", userIds)

            const profilesMap = (profileData || []).reduce((acc: any, curr: any) => {
                acc[curr.id] = curr
                return acc
            }, {})

            const mergedData = feedbackData.map(f => ({
                ...f,
                profiles: f.user_id ? profilesMap[f.user_id] : null
            }))

            setFeedbacks(mergedData)
        } else {
            setFeedbacks(feedbackData)
        }
      } else {
        setFeedbacks([])
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error)
      toast.error("Erro ao carregar feedbacks")
    } finally {
      setLoading(false)
    }
  }

  const filteredFeedbacks = feedbacks.filter(
    (f) =>
      (f.comment || "")?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.profiles?.email || "")?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.profiles?.first_name || "")?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStats = () => {
    const total = feedbacks.length
    const avg =
      total > 0
        ? feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / total
        : 0
    const promoters = feedbacks.filter((f) => f.rating >= 4).length
    return { total, avg, promoters }
  }

  const stats = getStats()

  return (
    <RequireRole roles={["admin"]}>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Voz da Comunidade</h1>
            <p className="text-muted-foreground">
              Gerencie e analise os feedbacks recebidos pela plataforma.
            </p>
          </div>
          <Button onClick={fetchFeedbacks} variant="outline" size="sm">
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />{" "}
            Sincronizar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Total de Feedbacks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Avaliação Média
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">
                {stats.avg.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">/ 5.0</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Promotores (4-5 ★)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{stats.promoters}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar nos comentários ou email..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Filtrar por nota" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="all">Todas as notas</SelectItem>
                    <SelectItem value="5">5 estrelas</SelectItem>
                    <SelectItem value="4">4 estrelas</SelectItem>
                    <SelectItem value="3">3 estrelas</SelectItem>
                    <SelectItem value="2">2 estrelas</SelectItem>
                    <SelectItem value="1">1 estrela</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">Buscando feedbacks...</p>
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground italic border-2 border-dashed rounded-xl">
                Nenhum feedback encontrado com esses filtros.
              </div>
            ) : (
              <div className="rounded-xl border overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[150px]">Data</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead className="w-[120px]">Nota</TableHead>
                      <TableHead>Comentário</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFeedbacks.map((f) => (
                      <TableRow key={f.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="text-[10px] font-mono text-muted-foreground">
                          {format(new Date(f.created_at), "dd/MM/yyyy HH:mm", {
                            locale: ptBR
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {f.profiles ? (
                                <>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm">
                                            {f.profiles.first_name} {f.profiles.last_name}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {f.profiles.email}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <span className="text-xs italic text-muted-foreground">Anônimo</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className={`h-3 w-3 ${f.rating >= 4 ? 'fill-green-500 text-green-500' : 'fill-yellow-400 text-yellow-400'}`} />
                            <span className="font-bold text-sm">{f.rating}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="text-sm italic text-gray-700 leading-relaxed py-2">
                            {f.comment ? `"${f.comment}"` : <span className="text-muted-foreground italic text-xs">Sem comentário</span>}
                          </p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RequireRole>
  )
}
