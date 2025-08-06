"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Archive,
  Trash2,
  Star,
  Flag,
  User,
  Clock,
  CheckCheck,
  Check,
  MessageSquare,
  Bell,
  BellOff,
  Settings,
  Plus
} from "lucide-react"
import Image from "next/image"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal"
import { format, isToday, isYesterday, isThisWeek } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Message {
  id: string
  content: string
  senderId: string
  timestamp: Date
  isRead: boolean
  type: 'text' | 'image' | 'file'
  fileUrl?: string
  fileName?: string
}

interface Conversation {
  id: string
  participants: {
    id: string
    name: string
    avatar?: string
    role: 'mentor' | 'mentee'
    online: boolean
    lastSeen?: Date
  }[]
  lastMessage: Message
  unreadCount: number
  isPinned: boolean
  isMuted: boolean
}

export default function MessagesPage() {
  const { t } = useTranslation()
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mock data - in real app, this would come from API
  const mockConversations: Conversation[] = [
    {
      id: '1',
      participants: [
        {
          id: 'user1',
          name: 'Sarah Johnson',
          avatar: '/images/mentors/sarah.jpg',
          role: 'mentor',
          online: true
        },
        {
          id: 'current-user',
          name: 'Você',
          role: 'mentee',
          online: true
        }
      ],
      lastMessage: {
        id: 'm1',
        content: 'Ótimo! Vamos focar na preparação para entrevistas técnicas na nossa próxima sessão.',
        senderId: 'user1',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        isRead: false,
        type: 'text'
      },
      unreadCount: 2,
      isPinned: true,
      isMuted: false
    },
    {
      id: '2',
      participants: [
        {
          id: 'user2',
          name: 'Carlos Silva',
          avatar: '/images/mentors/carlos.jpg',
          role: 'mentor',
          online: false,
          lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        {
          id: 'current-user',
          name: 'Você',
          role: 'mentee',
          online: true
        }
      ],
      lastMessage: {
        id: 'm2',
        content: 'Obrigado pelas dicas sobre React! Foram muito úteis.',
        senderId: 'current-user',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        isRead: true,
        type: 'text'
      },
      unreadCount: 0,
      isPinned: false,
      isMuted: false
    },
    {
      id: '3',
      participants: [
        {
          id: 'user3',
          name: 'Ana Costa',
          avatar: '/images/mentors/ana.jpg',
          role: 'mentor',
          online: true
        },
        {
          id: 'current-user',
          name: 'Você',
          role: 'mentee',
          online: true
        }
      ],
      lastMessage: {
        id: 'm3',
        content: 'Confirmo nossa sessão para amanhã às 14h. Até lá!',
        senderId: 'user3',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        isRead: true,
        type: 'text'
      },
      unreadCount: 0,
      isPinned: false,
      isMuted: true
    }
  ]

  const mockMessages: { [key: string]: Message[] } = {
    '1': [
      {
        id: 'm1',
        content: 'Oi! Como foi o processo seletivo que você mencionou?',
        senderId: 'user1',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isRead: true,
        type: 'text'
      },
      {
        id: 'm2',
        content: 'Oi Sarah! Foi bem interessante. Consegui passar na primeira etapa, mas agora tenho uma entrevista técnica na próxima semana.',
        senderId: 'current-user',
        timestamp: new Date(Date.now() - 90 * 60 * 1000),
        isRead: true,
        type: 'text'
      },
      {
        id: 'm3',
        content: 'Que ótima notícia! Parabéns por passar na primeira etapa. Para a entrevista técnica, você já praticou algoritmos e estruturas de dados?',
        senderId: 'user1',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        isRead: true,
        type: 'text'
      },
      {
        id: 'm4',
        content: 'Tenho praticado um pouco, mas ainda me sinto inseguro. Você teria algumas dicas específicas?',
        senderId: 'current-user',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        isRead: true,
        type: 'text'
      },
      {
        id: 'm5',
        content: 'Ótimo! Vamos focar na preparação para entrevistas técnicas na nossa próxima sessão.',
        senderId: 'user1',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        isRead: false,
        type: 'text'
      }
    ],
    '2': [
      {
        id: 'm6',
        content: 'Como está indo com os estudos de React?',
        senderId: 'user2',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        isRead: true,
        type: 'text'
      },
      {
        id: 'm7',
        content: 'Obrigado pelas dicas sobre React! Foram muito úteis.',
        senderId: 'current-user',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        isRead: true,
        type: 'text'
      }
    ]
  }

  useEffect(() => {
    if (!loading && !user) {
      setShowLoginModal(true)
    }
  }, [user, loading])

  useEffect(() => {
    // Simulate loading conversations
    setTimeout(() => {
      setConversations(mockConversations)
      setIsLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId)
    setMessages(mockMessages[conversationId] || [])
    
    // Mark messages as read
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    )
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return

    const message: Message = {
      id: `m${Date.now()}`,
      content: newMessage.trim(),
      senderId: 'current-user',
      timestamp: new Date(),
      isRead: false,
      type: 'text'
    }

    setMessages(prev => [...prev, message])
    setNewMessage("")

    // Update conversation's last message
    setConversations(prev =>
      prev.map(conv =>
        conv.id === selectedConversation
          ? { ...conv, lastMessage: message }
          : conv
      )
    )

    // Simulate typing and response (in real app, this would be real-time)
    if (selectedConversation === '1') {
      setTimeout(() => {
        const response: Message = {
          id: `m${Date.now() + 1}`,
          content: "Perfeito! Vou preparar alguns exercícios específicos para você.",
          senderId: 'user1',
          timestamp: new Date(),
          isRead: false,
          type: 'text'
        }
        setMessages(prev => [...prev, response])
      }, 2000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatMessageTime = (timestamp: Date) => {
    if (isToday(timestamp)) {
      return format(timestamp, 'HH:mm')
    } else if (isYesterday(timestamp)) {
      return 'Ontem'
    } else if (isThisWeek(timestamp)) {
      return format(timestamp, 'EEEE', { locale: ptBR })
    } else {
      return format(timestamp, 'dd/MM', { locale: ptBR })
    }
  }

  const getCurrentParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.id !== 'current-user')
  }

  const filteredConversations = conversations.filter(conv => {
    const participant = getCurrentParticipant(conv)
    return participant?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (loading) {
    return <MessagesSkeleton />
  }

  if (!user) {
    return (
      <LoginRequiredModal 
        isOpen={showLoginModal}
        onClose={() => router.push('/')}
      />
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Mensagens</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 h-full">
          {/* Conversations List */}
          <Card className="flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Conversas</CardTitle>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar conversas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-full">
                {isLoading ? (
                  <div className="space-y-4 p-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredConversations.map((conversation) => {
                      const participant = getCurrentParticipant(conversation)
                      const isSelected = selectedConversation === conversation.id
                      
                      return (
                        <div
                          key={conversation.id}
                          onClick={() => handleSelectConversation(conversation.id)}
                          className={`flex items-center gap-3 p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                            isSelected ? 'bg-muted' : ''
                          }`}
                        >
                          <div className="relative">
                            <div className="h-12 w-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                              {participant?.avatar ? (
                                <Image
                                  src={participant.avatar}
                                  alt={participant.name}
                                  width={48}
                                  height={48}
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                  <User className="h-6 w-6 text-primary/40" />
                                </div>
                              )}
                            </div>
                            {participant?.online && (
                              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-background rounded-full" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium truncate">{participant?.name}</h3>
                                {conversation.isPinned && (
                                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                )}
                                {conversation.isMuted && (
                                  <BellOff className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">
                                  {formatMessageTime(conversation.lastMessage.timestamp)}
                                </span>
                                {conversation.unreadCount > 0 && (
                                  <Badge variant="default" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-muted-foreground truncate flex-1">
                                {conversation.lastMessage.senderId === 'current-user' && (
                                  <span className="mr-1">Você:</span>
                                )}
                                {conversation.lastMessage.content}
                              </p>
                              {conversation.lastMessage.senderId === 'current-user' && (
                                <div className="text-muted-foreground">
                                  {conversation.lastMessage.isRead ? (
                                    <CheckCheck className="h-3 w-3" />
                                  ) : (
                                    <Check className="h-3 w-3" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const conversation = conversations.find(c => c.id === selectedConversation)
                        const participant = conversation ? getCurrentParticipant(conversation) : null
                        
                        return (
                          <>
                            <div className="relative">
                              <div className="h-10 w-10 rounded-full overflow-hidden bg-muted">
                                {participant?.avatar ? (
                                  <Image
                                    src={participant.avatar}
                                    alt={participant.name}
                                    width={40}
                                    height={40}
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                    <User className="h-5 w-5 text-primary/40" />
                                  </div>
                                )}
                              </div>
                              {participant?.online && (
                                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-medium">{participant?.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {participant?.online ? 'Online' : 
                                 participant?.lastSeen ? `Visto ${formatMessageTime(participant.lastSeen)}` : 'Offline'}
                              </p>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Video className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Star className="h-4 w-4 mr-2" />
                            Fixar conversa
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <BellOff className="h-4 w-4 mr-2" />
                            Silenciar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Archive className="h-4 w-4 mr-2" />
                            Arquivar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Deletar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>

                <Separator />

                {/* Messages */}
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-full p-4">
                    <div className="space-y-4">
                      {messages.map((message, index) => {
                        const isOwnMessage = message.senderId === 'current-user'
                        const showTimestamp = index === 0 || 
                          Math.abs(message.timestamp.getTime() - messages[index - 1].timestamp.getTime()) > 5 * 60 * 1000

                        return (
                          <div key={message.id} className="space-y-2">
                            {showTimestamp && (
                              <div className="text-center">
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                  {format(message.timestamp, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </span>
                              </div>
                            )}
                            
                            <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                              <div
                                className={`max-w-[70%] rounded-lg px-3 py-2 ${
                                  isOwnMessage
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                <div className={`flex items-center gap-1 mt-1 ${
                                  isOwnMessage ? 'justify-end' : 'justify-start'
                                }`}>
                                  <span className={`text-xs ${
                                    isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                  }`}>
                                    {format(message.timestamp, 'HH:mm')}
                                  </span>
                                  {isOwnMessage && (
                                    <div className="text-primary-foreground/70">
                                      {message.isRead ? (
                                        <CheckCheck className="h-3 w-3" />
                                      ) : (
                                        <Check className="h-3 w-3" />
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>

                <Separator />

                {/* Message Input */}
                <CardContent className="p-4">
                  <div className="flex items-end gap-2">
                    <Button size="sm" variant="outline">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Digite sua mensagem..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="pr-10"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground/50" />
                  <div>
                    <h3 className="text-lg font-medium">Selecione uma conversa</h3>
                    <p className="text-muted-foreground">
                      Escolha uma conversa na lista para começar a conversar
                    </p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

function MessagesSkeleton() {
  return (
    <div className="h-screen flex flex-col">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-8 w-32" />
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
      </div>

      <div className="flex-1 container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 h-full">
          <Card className="flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-10 w-full" />
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div className="space-y-4 p-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Skeleton className="h-16 w-16 mx-auto rounded" />
                <div>
                  <Skeleton className="h-6 w-48 mx-auto mb-2" />
                  <Skeleton className="h-4 w-64 mx-auto" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
