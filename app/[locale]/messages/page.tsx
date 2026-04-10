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
import { useTranslations } from "next-intl"

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
  const t = useTranslations("messages")
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
          // Recarregar se foi marcada como lida (para atualizar contador)
          if (payload.new.read_at !== payload.old.read_at) {
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
        .order('last_message_at', { ascending: false })

      if (error) throw error

      if (convs) {
        // Para cada conversa, buscar o nome do outro usuário e contagem de não lidas
        const conversationsWithDetails = await Promise.all(convs.map(async (conv) => {
          const otherUserId = conv.mentor_id === user.id ? conv.mentee_id : conv.mentor_id
          
          const { data: otherUser } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, is_mentor')
            .eq('id', otherUserId)
            .single()

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('receiver_id', user.id)
            .is('read_at', null)

          return {
            ...conv,
            unread_count: unreadCount || 0,
            other_user: otherUser
          }
        }))

        setConversations(conversationsWithDetails as Conversation[])
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.other_user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' })
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 h-[calc(100-4rem)]">
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto py-4 md:py-8 px-0 md:px-4 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-1 flex overflow-hidden border rounded-lg bg-card shadow-sm">
        {/* Sidebar de Conversas */}
        <div className={`w-full md:w-80 flex flex-col border-r ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold mb-4">{t("title")}</h1>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
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
                  {searchTerm ? t("noConversationsFound") : t("noConversationsYet")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm
                    ? t("tryAnotherSearch")
                    : t("startConversation")}
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
                            {conversation.other_user.is_mentor ? t("roleMentor") : t("roleMentee")}
                          </Badge>
                          {conversation.unread_count > 0 && (
                            <span className="text-xs text-primary font-semibold">
                              {t("newMessages", { count: conversation.unread_count })}
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
                <h3 className="text-lg font-semibold mb-2">{t("selectConversation")}</h3>
                <p className="text-muted-foreground">
                  {t("selectConversationDesc")}
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
                  {selectedConversation.other_user.is_mentor ? t("roleMentor") : t("roleMentee")}
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