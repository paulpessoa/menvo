"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, ArrowLeft, User, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton"
import { ChatInterface } from "@/components/chat/ChatInterface"
import { createClient } from "@/lib/utils/supabase/client"
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
    role_name: string
  }
}

interface RawConversation {
    id: string
    mentor_id: string
    mentee_id: string
    last_message_at: string | null
    created_at: string
}

function MessagesContent() {
  const t = useTranslations("messages")
  const { user, loading } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  const loadConversations = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    try {
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
        const rawConvs = convs as RawConversation[]
        const conversationsWithDetails = await Promise.all(rawConvs.map(async (conv) => {
          // Identificar o outro usuário de forma robusta
          const otherUserId = conv.mentor_id === user.id ? conv.mentee_id : conv.mentor_id
          
          // Se o chat for com o próprio usuário (ex: notas), ignoramos na listagem principal
          if (otherUserId === user.id) return null

          const { data: otherUser } = await supabase
            .from('profiles')
            .select(`
              id, 
              full_name, 
              avatar_url,
              user_roles (
                roles (
                  name
                )
              )
            `)
            .eq('id', otherUserId)
            .maybeSingle()

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .is('read_at', null)

          const roles = (otherUser as any)?.user_roles || []
          const roleNames = roles.map((ur: any) => ur.roles?.name).filter(Boolean)
          let primaryRole = 'mentee'
          if (roleNames.includes('admin')) primaryRole = 'admin'
          else if (roleNames.includes('mentor')) primaryRole = 'mentor'

          return {
            id: conv.id,
            mentor_id: conv.mentor_id,
            mentee_id: conv.mentee_id,
            last_message_at: conv.last_message_at,
            created_at: conv.created_at,
            unread_count: unreadCount || 0,
            other_user: {
              id: otherUserId,
              full_name: (otherUser as any)?.full_name || 'Usuário',
              avatar_url: (otherUser as any)?.avatar_url || null,
              role_name: primaryRole
            }
          }
        }))

        // Filtrar nulos (casos de chat com si mesmo)
        setConversations(conversationsWithDetails.filter(Boolean) as Conversation[])
      }
    } catch (error) {
      console.error("Error loading conversations:", error)
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user, loadConversations])

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('conversations-list-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => { loadConversations() })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload: any) => {
          if (payload.new.read_at !== payload.old.read_at) { loadConversations() }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel) };
  }, [user, supabase, loadConversations])

  const filteredConversations = conversations.filter(conv =>
    (conv.other_user?.full_name || '').toLowerCase().includes((searchTerm || '').toLowerCase())
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

  const getRoleLabel = (roleName: string) => {
    switch (roleName) {
      case 'admin': return t("roleAdmin")
      case 'mentor': return t("roleMentor")
      case 'mentee': return t("roleMentee")
      default: return t("roleUser")
    }
  }

  if (loading) {
    return <div className="container mx-auto py-8 px-4 h-[calc(100vh-4rem)]"><Skeleton className="h-full w-full" /></div>
  }
  if (!user) return null

  return (
    <div className="container mx-auto py-4 md:py-8 px-0 md:px-4 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-1 flex overflow-hidden border rounded-lg bg-card shadow-sm">
        <div className={`w-full md:w-80 flex flex-col border-r ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold mb-4">{t("title")}</h1>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t("searchPlaceholder")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading && conversations.length === 0 ? (
                <div className="p-4 space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">{searchTerm ? t("noConversationsFound") : t("noConversationsYet")}</h3>
              </div>
            ) : (
              <div className="divide-y">
                {filteredConversations.map((conversation) => (
                  <div key={conversation.id} className={`p-4 cursor-pointer hover:bg-muted/50 ${selectedConversation?.id === conversation.id ? 'bg-primary/5' : ''}`} onClick={() => setSelectedConversation(conversation)}>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border">
                        <AvatarImage src={conversation.other_user?.avatar_url || undefined} />
                        <AvatarFallback><User className="h-6 w-6" /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-semibold truncate text-sm">{conversation.other_user?.full_name}</span>
                          <span className="text-[10px] text-muted-foreground">{formatTimestamp(conversation.last_message_at)}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] py-0 h-4">{getRoleLabel(conversation.other_user?.role_name)}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="hidden md:flex flex-1 flex-col">
          {selectedConversation ? (
            <ChatInterface key={selectedConversation.id} mentorId={selectedConversation.other_user.id} currentUserId={user.id} mentorName={selectedConversation.other_user.full_name} mentorAvatar={selectedConversation.other_user.avatar_url || undefined} />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-muted/5 text-center"><MessageCircle className="h-12 w-12 text-primary/20 mb-4 mx-auto" /><p>{t("selectConversation")}</p></div>
          )}
        </div>
        {selectedConversation && (
          <div className="md:hidden fixed inset-0 bg-background z-50 flex flex-col">
            <div className="p-3 border-b flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setSelectedConversation(null)}><ArrowLeft className="h-5 w-5" /></Button>
              <h2 className="font-semibold text-sm">{selectedConversation.other_user.full_name}</h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatInterface key={`mobile-${selectedConversation.id}`} mentorId={selectedConversation.other_user.id} currentUserId={user.id} mentorName={selectedConversation.other_user.full_name} mentorAvatar={selectedConversation.other_user.avatar_url || undefined} />
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
