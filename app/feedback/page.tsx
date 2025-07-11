"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts"
import { Star, TrendingUp, Users, MessageSquare, Search, Download } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useFeedback, useFeedbackStats } from "@/hooks/api/use-feedback"
import { useAuth } from "@/hooks/useAuth"

const COLORS = ["#22c55e", "#eab308", "#ef4444"]

export default function FeedbackPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [ratingFilter, setRatingFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"date" | "rating">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const isAdminOrModerator = user?.role === "admin" || user?.role === "moderator"

  const { data: feedback, isLoading } = useFeedback({
    search: searchTerm,
    rating: ratingFilter === "all" ? undefined : Number.parseInt(ratingFilter),
    sortBy,
    sortOrder,
  })

  const { data: stats } = useFeedbackStats()

  if (!isAdminOrModerator) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Acesso restrito a administradores e moderadores.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const exportToCSV = () => {
    if (!feedback) return

    const csvContent = [
      ["Data", "Usuário", "Email", "Avaliação", "Comentário", "Página"].join(","),
      ...feedback.map((item: any) =>
        [
          format(new Date(item.created_at), "dd/MM/yyyy HH:mm"),
          item.profiles ? `${item.profiles.first_name} ${item.profiles.last_name}` : "Anônimo",
          item.email || item.profiles?.email || "",
          item.rating,
          `"${item.comment || ""}"`,
          item.page_url || "",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `feedback_${format(new Date(), "yyyy-MM-dd")}.csv`
    link.click()
  }

  // Prepare chart data
  const ratingDistribution = [
    { name: "Promotores (9-10)", value: stats?.promoters || 0, color: "#22c55e" },
    { name: "Neutros (7-8)", value: stats?.passives || 0, color: "#eab308" },
    { name: "Detratores (1-6)", value: stats?.detractors || 0, color: "#ef4444" },
  ]

  const monthlyFeedback =
    feedback?.reduce((acc: any, item: any) => {
      const month = format(new Date(item.created_at), "MMM yyyy", { locale: ptBR })
      const existing = acc.find((entry: any) => entry.month === month)
      if (existing) {
        existing.count += 1
        existing.avgRating = (existing.avgRating * (existing.count - 1) + item.rating) / existing.count
      } else {
        acc.push({ month, count: 1, avgRating: item.rating })
      }
      return acc
    }, []) || []

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
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Feedback dos Usuários</h1>
          <p className="text-muted-foreground">Análise de satisfação e comentários da plataforma</p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Feedback</p>
                  <p className="text-2xl font-bold">{stats.total_feedback}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avaliação Média</p>
                  <p className="text-2xl font-bold">{stats.avg_rating?.toFixed(1)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">NPS Score</p>
                  <p className="text-2xl font-bold">{stats.nps_score?.toFixed(0)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Últimos 30 dias</p>
                  <p className="text-2xl font-bold">{stats.feedback_last_30_days}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NPS Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição NPS</CardTitle>
            <CardDescription>Classificação dos usuários por satisfação</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ratingDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ratingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Tendência Mensal</CardTitle>
            <CardDescription>Evolução do feedback ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyFeedback}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" name="Quantidade" />
                  <Line type="monotone" dataKey="avgRating" stroke="#82ca9d" name="Avaliação Média" />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Todos os Feedbacks</CardTitle>
              <CardDescription>Lista completa de comentários e avaliações</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por comentário, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as avaliações</SelectItem>
                <SelectItem value="5">5 estrelas</SelectItem>
                <SelectItem value="4">4 estrelas</SelectItem>
                <SelectItem value="3">3 estrelas</SelectItem>
                <SelectItem value="2">2 estrelas</SelectItem>
                <SelectItem value="1">1 estrela</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: "date" | "rating") => setSortBy(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Por Data</SelectItem>
                <SelectItem value="rating">Por Avaliação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Avaliação</TableHead>
                  <TableHead>Comentário</TableHead>
                  <TableHead>Página</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedback && feedback.length > 0 ? (
                  feedback.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>{format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                      <TableCell>
                        <div>
                          {item.profiles ? (
                            <>
                              <p className="font-medium">
                                {item.profiles.first_name} {item.profiles.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">{item.profiles.email}</p>
                            </>
                          ) : (
                            <>
                              <p className="font-medium">Anônimo</p>
                              <p className="text-sm text-muted-foreground">{item.email}</p>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={item.rating >= 4 ? "default" : item.rating >= 3 ? "secondary" : "destructive"}
                          >
                            {item.rating}
                          </Badge>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${
                                  star <= item.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.comment ? (
                          <p className="text-sm max-w-xs truncate" title={item.comment}>
                            {item.comment}
                          </p>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.page_url ? (
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">{item.page_url}</code>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">Nenhum feedback encontrado.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Results count */}
          {feedback && feedback.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Mostrando {feedback.length} feedback{feedback.length !== 1 ? "s" : ""}
              {searchTerm && ` para "${searchTerm}"`}
              {ratingFilter !== "all" && ` com ${ratingFilter} estrela${ratingFilter !== "1" ? "s" : ""}`}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
