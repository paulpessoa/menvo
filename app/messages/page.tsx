import { Suspense } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, Search, Filter, Send, Clock, CheckCheck } from "lucide-react"
import MessagesLoading from "./loading"

// Componente que contém o conteúdo principal
function MessagesContent() {
  // Mock data para demonstração
  const messages = [
    {
      id: 1,
      sender: "Ana Silva",
      avatar: "/placeholder.svg?height=40&width=40",
      subject: "Dúvida sobre mentoria em React",
      preview: "Olá! Gostaria de saber mais sobre suas experiências com React e como posso melhorar...",
      timestamp: "2 horas atrás",
      status: "unread",
      type: "mentee",
    },
    {
      id: 2,
      sender: "Carlos Santos",
      avatar: "/placeholder.svg?height=40&width=40",
      subject: "Agendamento de sessão",
      preview: "Podemos marcar nossa próxima sessão para quinta-feira? Tenho algumas questões sobre...",
      timestamp: "5 horas atrás",
      status: "read",
      type: "mentor",
    },
    {
      id: 3,
      sender: "Maria Oliveira",
      avatar: "/placeholder.svg?height=40&width=40",
      subject: "Feedback da última sessão",
      preview: "Muito obrigada pela sessão de ontem! Foi muito esclarecedora. Gostaria de compartilhar...",
      timestamp: "1 dia atrás",
      status: "replied",
      type: "mentee",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Mensagens</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie suas conversas com mentores e mentorados</p>
        </div>

        {/* Search and filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="Buscar mensagens..." className="pl-10" />
          </div>
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Nova Mensagem
          </Button>
        </div>

        {/* Messages list */}
        <div className="space-y-4">
          {messages.map((message) => (
            <Card
              key={message.id}
              className={`hover:shadow-md transition-shadow cursor-pointer ${
                message.status === "unread" ? "border-l-4 border-l-blue-500" : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={message.avatar || "/placeholder.svg"} alt={message.sender} />
                      <AvatarFallback>
                        {message.sender
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{message.sender}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {message.type === "mentor" ? "Mentor" : "Mentorado"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={message.status === "unread" ? "default" : "secondary"} className="text-xs">
                      {message.status === "unread" && "Nova"}
                      {message.status === "read" && "Lida"}
                      {message.status === "replied" && "Respondida"}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {message.timestamp}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">{message.subject}</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{message.preview}</p>
                <div className="flex justify-between items-center">
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Responder
                  </Button>
                  {message.status === "replied" && (
                    <div className="flex items-center gap-1 text-green-600 text-xs">
                      <CheckCheck className="h-3 w-3" />
                      Respondida
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty state */}
        {messages.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Nenhuma mensagem ainda</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Quando você receber mensagens de mentores ou mentorados, elas aparecerão aqui.
              </p>
              <Button>Encontrar Mentores</Button>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {messages.length > 0 && (
          <div className="mt-8 flex justify-center">
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" disabled>
                Anterior
              </Button>
              <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600">
                1
              </Button>
              <Button variant="outline" size="sm">
                2
              </Button>
              <Button variant="outline" size="sm">
                3
              </Button>
              <Button variant="outline" size="sm">
                Próximo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Componente principal exportado com Suspense
export default function MessagesPage() {
  return (
    <Suspense fallback={<MessagesLoading />}>
      <MessagesContent />
    </Suspense>
  )
}
