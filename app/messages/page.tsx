"use client"

import { Suspense, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MessageCircle, Clock, User } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton"

interface Message {
  id: string
  sender: {
    id: string
    name: string
    avatar?: string
    role: string
  }
  recipient: {
    id: string
    name: string
    avatar?: string
    role: string
  }
  subject: string
  preview: string
  timestamp: string
  isRead: boolean
  isImportant: boolean
}

function MessagesContent() {
  const { user, loading } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "unread" | "important">("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simular carregamento de mensagens
    const loadMessages = async () => {
      setIsLoading(true)
      // Aqui você faria a chamada real para a API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Dados mock para demonstração
      const mockMessages: Message[] = [
        {
          id: "1",
          sender: {
            id: "mentor1",
            name: "Ana Silva",
            avatar: "/placeholder-user.jpg",
            role: "mentor",
          },
          recipient: {
            id: user?.id || "current-user",
            name: "Você",
            role: "mentee",
          },
          subject: "Sessão de mentoria agendada",
          preview: "Olá! Confirmando nossa sessão de mentoria para amanhã às 14h...",
          timestamp: "2024-01-15T10:30:00Z",
          isRead: false,
          isImportant: true,
        },
        {
          id: "2",
          sender: {
            id: "mentee1",
            name: "João Santos",
            avatar: "/placeholder-user.jpg",
            role: "mentee",
          },
          recipient: {
            id: user?.id || "current-user",
            name: "Você",
            role: "mentor",
          },
          subject: "Dúvida sobre carreira",
          preview: "Gostaria de conversar sobre transição de carreira...",
          timestamp: "2024-01-14T16:45:00Z",
          isRead: true,
          isImportant: false,
        },
      ]

      setMessages(mockMessages)
      setIsLoading(false)
    }

    if (user) {
      loadMessages()
    }
  }, [user])

  const filteredMessages = messages.filter((message) => {
    const matchesSearch =
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.preview.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter =
      filter === "all" || (filter === "unread" && !message.isRead) || (filter === "important" && message.isImportant)

    return matchesSearch && matchesFilter
  })

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    } else {
      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    }
  }

  if (loading || isLoading) {
    return <MessagesLoadingSkeleton />
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-4">Você precisa estar logado para acessar suas mensagens.</p>
          <Button onClick={() => (window.location.href = "/login")}>Fazer Login</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mensagens</h1>
          <p className="text-muted-foreground">Gerencie suas conversas com mentores e mentorados</p>
        </div>

        {/* Search and filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar mensagens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
              Todas
            </Button>
            <Button variant={filter === "unread" ? "default" : "outline"} size="sm" onClick={() => setFilter("unread")}>
              Não lidas
            </Button>
            <Button
              variant={filter === "important" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("important")}
            >
              Importantes
            </Button>
          </div>
        </div>

        {/* Messages list */}
        {filteredMessages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma mensagem encontrada</h3>
              <p className="text-muted-foreground">
                {searchTerm || filter !== "all" ? "Tente ajustar os filtros de busca" : "Você ainda não tem mensagens"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((message) => (
              <Card
                key={message.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${!message.isRead ? "border-l-4 border-l-primary" : ""
                  }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={message.sender.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{message.sender.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {message.sender.role === "mentor" ? "Mentor" : "Mentorado"}
                          </Badge>
                        </div>
                        <CardTitle className="text-sm font-medium">{message.subject}</CardTitle>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {message.isImportant && (
                        <Badge variant="destructive" className="text-xs">
                          Importante
                        </Badge>
                      )}
                      {!message.isRead && <div className="h-2 w-2 bg-primary rounded-full" />}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 line-clamp-2">{message.preview}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(message.timestamp)}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Responder
                      </Button>
                      <Button size="sm">Ver conversa</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MessagesLoadingSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Search and filters */}
        <div className="mb-6 flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Messages list */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <div className="flex justify-between items-center mt-4">
                  <Skeleton className="h-3 w-20" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<MessagesLoadingSkeleton />}>
      <MessagesContent />
    </Suspense>
  )
}
