"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import { useRouter, useSearchParams } from "next/navigation"
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useMentors } from '@/hooks/useMentors'
import { MentorProfile } from '@/services/mentors/mentors'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Send, MessageSquare, User, Search, XCircle } from 'lucide-react'

interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: string
}

interface Conversation {
  id: string
  participant1Id: string
  participant2Id: string
  participant1Name: string
  participant2Name: string
  participant1Avatar?: string
  participant2Avatar?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialMentorId = searchParams.get('mentor')

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: mentorsData, isLoading: mentorsLoading } = useMentors({ limit: 100 }) // Fetch all mentors for new message functionality

  const currentUserId = user?.id

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/unauthorized")
    } else if (user) {
      fetchConversations()
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (initialMentorId && mentorsData?.mentors && currentUserId) {
      const mentor = mentorsData.mentors.find(m => m.id === initialMentorId)
      if (mentor) {
        // Check if a conversation already exists with this mentor
        const existingConversation = conversations.find(
          (conv) => conv.participant1Id === mentor.user_id || conv.participant2Id === mentor.user_id
        )
        if (existingConversation) {
          setSelectedConversationId(existingConversation.id)
        } else {
          // Create a mock conversation for a new message
          const newConvId = `new-${mentor.user_id}`
          const newConv: Conversation = {
            id: newConvId,
            participant1Id: currentUserId,
            participant2Id: mentor.user_id,
            participant1Name: user?.user_metadata?.full_name || user?.email || "Você",
            participant2Name: `${mentor.first_name} ${mentor.last_name}`,
            participant2Avatar: mentor.avatar_url || "/placeholder-user.jpg",
            lastMessage: "Nova conversa",
            lastMessageTime: new Date().toISOString(),
            unreadCount: 0,
          }
          setConversations((prev) => [newConv, ...prev.filter(c => c.id !== newConvId)])
          setSelectedConversationId(newConvId)
          setMessages([]) // Start with no messages for a new conversation
        }
      }
    }
  }, [initialMentorId, mentorsData, currentUserId, conversations, user])

  useEffect(() => {
    if (selectedConversationId && selectedConversationId.startsWith('new-')) {
      setMessages([]) // Clear messages for new conversations
      setIsLoadingMessages(false)
      return
    }
    if (selectedConversationId) {
      fetchMessages(selectedConversationId)
    } else {
      setMessages([])
    }
  }, [selectedConversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchConversations = async () => {
    setIsLoadingConversations(true)
    try {
      // Mock API call for conversations
      const mockConversations: Conversation[] = [
        {
          id: "conv1",
          participant1Id: "user1",
          participant2Id: "mentor1",
          participant1Name: "Você",
          participant2Name: "João Silva",
          participant2Avatar: "/images/mockMentors/10879746.jpg",
          lastMessage: "Obrigado pela sessão de hoje!",
          lastMessageTime: "2025-08-05T14:30:00Z",
          unreadCount: 0,
        },
        {
          id: "conv2",
          participant1Id: "user1",
          participant2Id: "mentor2",
          participant1Name: "Você",
          participant2Name: "Maria Oliveira",
          participant2Avatar: "/images/mockMentors/8681238.jpg",
          lastMessage: "Claro, podemos agendar para semana que vem.",
          lastMessageTime: "2025-08-04T10:00:00Z",
          unreadCount: 1,
        },
        {
          id: "conv3",
          participant1Id: "user1",
          participant2Id: "mentor3",
          participant1Name: "Você",
          participant2Name: "Pedro Souza",
          participant2Avatar: "/images/mockMentors/9963087.jpg",
          lastMessage: "Estou disponível na terça-feira.",
          lastMessageTime: "2025-08-03T18:00:00Z",
          unreadCount: 0,
        },
      ]
      setConversations(mockConversations)
    } catch (error: any) {
      toast({
        title: "Erro ao carregar conversas",
        description: error.message || "Não foi possível carregar suas conversas.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingConversations(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    setIsLoadingMessages(true)
    try {
      // Mock API call for messages
      const mockMessages: Message[] = [
        { id: "msg1", senderId: "mentor1", receiverId: "user1", content: "Olá! Como posso ajudar?", timestamp: "2025-08-05T14:00:00Z" },
        { id: "msg2", senderId: "user1", receiverId: "mentor1", content: "Olá João! Gostaria de discutir sobre transição de carreira.", timestamp: "2025-08-05T14:05:00Z" },
        { id: "msg3", senderId: "mentor1", receiverId: "user1", content: "Ótimo! Podemos agendar uma sessão para isso. Qual sua disponibilidade?", timestamp: "2025-08-05T14:10:00Z" },
        { id: "msg4", senderId: "user1", receiverId: "mentor1", content: "Obrigado pela sessão de hoje!", timestamp: "2025-08-05T14:30:00Z" },
      ]
      setMessages(mockMessages)
    } catch (error: any) {
      toast({
        title: "Erro ao carregar mensagens",
        description: error.message || "Não foi possível carregar as mensagens.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversationId || !currentUserId) return

    const currentConversation = conversations.find(c => c.id === selectedConversationId)
    if (!currentConversation) return

    const receiverId = currentConversation.participant1Id === currentUserId ? currentConversation.participant2Id : currentConversation.participant1Id

    const messageToSend: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUserId,
      receiverId: receiverId,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, messageToSend])
    setNewMessage("")

    try {
      // TODO: Implement actual API call to send message and update conversation
      console.log("Sending message:", messageToSend)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      // Update last message in conversations list
      setConversations(prev => prev.map(conv =>
        conv.id === selectedConversationId
          ? { ...conv, lastMessage: messageToSend.content, lastMessageTime: messageToSend.timestamp, unreadCount: 0 }
          : conv
      ))

    } catch (error: any) {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message || "Não foi possível enviar sua mensagem.",
        variant: "destructive",
      })
    }
  }

  const selectedConversation = conversations.find(
    (conv) => conv.id === selectedConversationId
  )

  const filteredConversations = conversations.filter(conv =>
    conv.participant1Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.participant2Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (authLoading || !user) {
    return null // Redirect handled by useEffect
  }

  return (
    <ProtectedRoute requiredRoles={['mentee', 'mentor', 'admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12 h-[calc(100vh-150px)] flex flex-col">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">Mensagens</h1>

        <Card className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Conversations List */}
          <div className="w-full md:w-1/3 border-r flex flex-col">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar conversas..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {isLoadingConversations ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Nenhuma conversa encontrada.
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`flex items-center gap-3 p-4 border-b cursor-pointer hover:bg-muted ${
                      selectedConversationId === conv.id ? "bg-muted" : ""
                    }`}
                    onClick={() => setSelectedConversationId(conv.id)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conv.participant2Avatar || "/placeholder-user.jpg"} alt={conv.participant2Name} />
                      <AvatarFallback>{conv.participant2Name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="font-medium">{conv.participant2Name}</p>
                        {conv.unreadCount > 0 && (
                          <Badge className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {conv.lastMessage}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Right Content - Chat Window */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b p-4 flex flex-row items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConversation.participant2Avatar || "/placeholder-user.jpg"} alt={selectedConversation.participant2Name} />
                    <AvatarFallback>{selectedConversation.participant2Name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-lg flex-1">
                    {selectedConversation.participant2Name}
                  </CardTitle>
                  {selectedConversationId.startsWith('new-') && (
                    <Button variant="ghost" size="icon" onClick={() => setSelectedConversationId(null)}>
                      <XCircle className="h-5 w-5" />
                      <span className="sr-only">Fechar nova conversa</span>
                    </Button>
                  )}
                </CardHeader>
                <ScrollArea className="flex-1 p-4">
                  {isLoadingMessages ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.senderId === currentUserId ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              msg.senderId === currentUserId
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-xs text-right opacity-70 mt-1">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
                <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center gap-2">
                  <Textarea
                    placeholder="Digite sua mensagem..."
                    className="flex-1 resize-none"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    rows={1}
                  />
                  <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                    <Send className="h-5 w-5" />
                    <span className="sr-only">Enviar mensagem</span>
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg">Selecione uma conversa para começar a conversar.</p>
                <p className="text-sm mt-2">
                  Ou{" "}
                  <Button variant="link" className="p-0 h-auto" onClick={() => setSelectedConversationId(conversations[0]?.id)}>
                    comece uma nova conversa
                  </Button>
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
