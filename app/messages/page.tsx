"use client"

import { Suspense, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, ArrowLeft, User } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton"
import { ChatInterface } from "@/components/chat/ChatInterface"
import { createClient } from "@/utils/supabase/client"

interface Conversation {
  id: string
  mentor_id: string
  mentee_id: string
  last_message_at: string | null
  created_at: string
  unread_count: number
  other_user: {
    id: string
    full_name: string
    avatar_url: string | null
    is_mentor: boolean
  }
}

function MessagesContent() {
  const { user, loading } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user])

  const loadConversations = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Buscar conversas do usuário
      const { data: convs, error } = await supabase
        .from('conversations')
        .select(`
          id,
          mentor_id,
          mentee_id,
          last_message_at,
          created_at
        `)
        .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false })

      if (error) throw error

      // Para cada conversa, buscar dados do outro usuário e contar não lidas
      const conversationsWithUsers = await Promise.all(
        (convs || []).map(async (conv) => {
          // Determinar quem é o "outro usuário" (não é o usuário atual)
          const otherUserId = conv.mentor_id === user.id ? conv.mentee_id : conv.mentor_id
          const isMentor = conv.mentor_id === otherUserId

          // Buscar perfil do outro usuário
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url')
            .eq('id', otherUserId)
            .single()

          // Contar mensagens não lidas (mensagens que não são minhas e não foram lidas)
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .is('read_at', null)

          return {
            ...conv,
            unread_count: unreadCount || 0,
            other_user: {
              id: otherUserId,
              full_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Usuário',
              avatar_url: profile?.avatar_url || null,
              is_mentor: isMentor,
            },
          }
        })
      )

      setConversations(conversationsWithUsers)
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'Agora'

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

  // Se uma conversa está selecionada, mostrar o chat
  if (selectedConversation) {
    // O ChatInterface espera mentorId, mas vamos passar sempre o mentor_id da conversa
    // O nome e avatar são do "outro usuário" (quem está do outro lado da conversa)
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => setSelectedConversation(null)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para conversas
          </Button>

          <ChatInterface
            key={selectedConversation.id}
            mentorId={selectedConversation.other_user.id}
            currentUserId={user.id}
            mentorName={selectedConversation.other_user.full_name}
            mentorAvatar={selectedConversation.other_user.avatar_url || undefined}
          />
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
          <p className="text-muted-foreground">Suas conversas com mentores e mentorados</p>
        </div>

        {/* Conversations list */}
        {conversations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma conversa ainda</h3>
              <p className="text-muted-foreground">
                Inicie uma conversa com um mentor para começar!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <Card
                key={conversation.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${conversation.unread_count > 0 ? 'border-l-4 border-l-indigo-600' : ''
                  }`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={conversation.other_user.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>
                            <User className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        {conversation.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                            {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${conversation.unread_count > 0 ? 'text-indigo-600' : ''}`}>
                            {conversation.other_user.full_name}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {conversation.other_user.is_mentor ? "Mentor" : "Mentorado"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatTimestamp(conversation.last_message_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {conversation.unread_count > 0 && (
                        <Badge variant="default" className="bg-indigo-600">
                          {conversation.unread_count} nova{conversation.unread_count > 1 ? 's' : ''}
                        </Badge>
                      )}
                      <Button size="sm">Abrir chat</Button>
                    </div>
                  </div>
                </CardHeader>
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
