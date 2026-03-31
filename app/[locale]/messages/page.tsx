"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, ArrowLeft, User, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
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
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user])

  // Subscrever ao Realtime para atualizar a lista de conversas
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('conversations-list-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          console.log('[MESSAGES] Nova mensagem via Realtime, recarregando conversas');
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload: any) => {
          console.log('[MESSAGES] Mensagem atualizada via Realtime:', payload);
          // Recarregar se foi marcada como lida (para atualizar contador)
          if (payload.new.read_at !== payload.old.read_at) {
            console.log('[MESSAGES] Mensagem marcada como lida, recarregando conversas');
            loadConversations();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        (convs || []).map(async (conv: any) => {
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

  // Removido loading screen - mantém conversas visíveis durante carregamento

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

  // Filtrar conversas pela busca
  const filteredConversations = conversations.filter((conv) =>
    conv.other_user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-7xl mx-auto h-[600px] border rounded-lg overflow-hidden flex bg-background shadow-sm">
        {/* Sidebar de Conversas */}
        <div className="w-full md:w-96 border-r bg-background flex flex-col">
          {/* Header da Sidebar */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold">Mensagens</h1>
              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  Carregando...
                </div>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Lista de Conversas */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">
                  {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm
                    ? 'Tente buscar por outro nome'
                    : 'Inicie uma conversa com um mentor!'}
                </p>
              </div>
            ) : (
              <div>
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 border-b cursor-pointer transition-colors hover:bg-muted/50 ${selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                      } ${conversation.unread_count > 0 ? 'border-l-4 border-l-primary' : ''}`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={conversation.other_user.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>
                            <User className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        {conversation.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                            {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`font-semibold truncate ${conversation.unread_count > 0 ? 'text-primary' : ''}`}>
                            {conversation.other_user.full_name}
                          </span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTimestamp(conversation.last_message_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {conversation.other_user.is_mentor ? "Mentor" : "Mentorado"}
                          </Badge>
                          {conversation.unread_count > 0 && (
                            <span className="text-xs text-primary font-semibold">
                              {conversation.unread_count} nova{conversation.unread_count > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Área do Chat */}
        <div className="hidden md:flex flex-1 flex-col">
          {selectedConversation ? (
            <ChatInterface
              key={selectedConversation.id}
              mentorId={selectedConversation.other_user.id}
              currentUserId={user.id}
              mentorName={selectedConversation.other_user.full_name}
              mentorAvatar={selectedConversation.other_user.avatar_url || undefined}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-muted/20">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Selecione uma conversa</h3>
                <p className="text-muted-foreground">
                  Escolha uma conversa na sidebar para começar a trocar mensagens
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Mobile: Chat em tela cheia quando selecionado */}
        {selectedConversation && (
          <div className="md:hidden fixed inset-0 bg-background z-50 flex flex-col">
            <div className="p-4 border-b flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedConversation(null)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedConversation.other_user.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="font-semibold">{selectedConversation.other_user.full_name}</h2>
                <Badge variant="secondary" className="text-xs">
                  {selectedConversation.other_user.is_mentor ? "Mentor" : "Mentorado"}
                </Badge>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatInterface
                key={selectedConversation.id}
                mentorId={selectedConversation.other_user.id}
                currentUserId={user.id}
                mentorName={selectedConversation.other_user.full_name}
                mentorAvatar={selectedConversation.other_user.avatar_url || undefined}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
export default function MessagesPage() {
  return <MessagesContent />
}
