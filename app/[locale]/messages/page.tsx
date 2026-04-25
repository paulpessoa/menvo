"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, ArrowLeft, User, Search, Archive, MoreVertical, RotateCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton"
import { ChatInterface } from "@/components/chat/ChatInterface"
import { createClient } from "@/lib/utils/supabase/client"
import { useTranslations } from "next-intl"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set())
  const supabase = createClient()

  // Gerenciamento de arquivamento via localStorage para simplicidade e utilidade imediata
  useEffect(() => {
    const saved = localStorage.getItem('menvo_archived_chats')
    if (saved) {
      try {
        setArchivedIds(new Set(JSON.parse(saved)))
      } catch (e) {
        console.error("Erro ao carregar chats arquivados")
      }
    }
  }, [])

  const toggleArchive = (id: string) => {
    const newSet = new Set(archivedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
      if (selectedConversation?.id === id) setSelectedConversation(null)
    }
    setArchivedIds(newSet)
    localStorage.setItem('menvo_archived_chats', JSON.stringify(Array.from(newSet)))
  }

  const loadConversations = useCallback(async (isInitial = true) => {
    if (!user) return

    if (isInitial) setIsLoading(true)
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
        
        const conversationsWithDetails = []
        for (const conv of rawConvs) {
          try {
            const otherUserId = conv.mentor_id === user.id ? conv.mentee_id : conv.mentor_id
            if (otherUserId === user.id) continue

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

            conversationsWithDetails.push({
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
            })
          } catch (itemErr) {
            console.warn(`[Messages] Erro ao carregar detalhes da conversa ${conv.id}`)
          }
        }

        setConversations(conversationsWithDetails as Conversation[])
      }
    } catch (error) {
    } finally {
      if (isInitial) setIsLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    let mounted = true
    if (user && mounted) {
      loadConversations()
    }
    return () => { mounted = false }
  }, [user, loadConversations])

  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel(`user-chats-${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages'
      }, (payload: any) => { 
          if (payload.new?.sender_id !== user.id) {
            loadConversations(false) 
          }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel) };
  }, [user, supabase, loadConversations])

  const filteredConversations = conversations
    .filter(conv => !archivedIds.has(conv.id))
    .filter(conv =>
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
    return <div className="container mx-auto py-8 px-4 h-[calc(100vh-4rem)]"><Skeleton className="h-full w-full rounded-2xl" /></div>
  }
  if (!user) return null

  return (
    <div className="container mx-auto py-4 md:py-8 px-0 md:px-4 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-1 flex overflow-hidden border rounded-2xl bg-card shadow-lg">
        {/* Sidebar */}
        <div className={`w-full md:w-80 flex flex-col border-r bg-muted/5 ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 border-b bg-white/50 backdrop-blur-sm">
            <h1 className="text-2xl font-bold mb-4 tracking-tight flex items-center gap-2">
                {t("title")}
                {archivedIds.size > 0 && (
                    <Badge variant="outline" className="font-normal text-[10px] text-muted-foreground">
                        {archivedIds.size} arquivados
                    </Badge>
                )}
            </h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={t("searchPlaceholder")} 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-10 bg-white border-none shadow-sm focus-visible:ring-primary h-11 rounded-xl" 
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoading && conversations.length === 0 ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-12 text-center">
                <div className="bg-primary/5 p-4 rounded-full w-fit mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-primary/40" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {searchTerm ? t("noConversationsFound") : t("noConversationsYet")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {searchTerm ? "Tente outro nome ou limpe a busca." : "Suas novas conversas aparecerão aqui."}
                </p>
              </div>
            ) : (
              <>
                {filteredConversations.map((conversation) => (
                  <div 
                    key={conversation.id} 
                    className={`group p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                        selectedConversation?.id === conversation.id 
                        ? 'bg-white shadow-md ring-1 ring-black/5' 
                        : 'hover:bg-white/60'
                    }`} 
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                          <AvatarImage src={conversation.other_user?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                            {conversation.other_user?.full_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.unread_count > 0 && (
                          <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold truncate text-sm text-gray-900">{conversation.other_user?.full_name}</span>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatTimestamp(conversation.last_message_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-muted/50 text-muted-foreground border-none">
                              {getRoleLabel(conversation.other_user?.role_name)}
                           </Badge>
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem 
                          onClick={() => toggleArchive(conversation.id)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Archive className="h-4 w-4" />
                          Arquivar conversa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </>
            )}
            
            {/* Link para restaurar arquivados se houver algum */}
            {archivedIds.size > 0 && searchTerm === '' && (
                <div className="mt-8 pt-4 border-t px-4 pb-4">
                   <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2">Opções</p>
                   <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start text-xs text-muted-foreground hover:text-primary"
                    onClick={() => {
                        setArchivedIds(new Set())
                        localStorage.removeItem('menvo_archived_chats')
                    }}
                   >
                       <RotateCcw className="h-3 w-3 mr-2" />
                       Restaurar todos os arquivados
                   </Button>
                </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="hidden md:flex flex-1 flex-col bg-white overflow-hidden">
          {selectedConversation ? (
            <ChatInterface 
              key={selectedConversation.id} 
              mentorId={selectedConversation.other_user.id} 
              currentUserId={user.id} 
              mentorName={selectedConversation.other_user.full_name} 
              mentorAvatar={selectedConversation.other_user.avatar_url || undefined} 
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center max-w-lg mx-auto">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full scale-150 animate-pulse" />
                <div className="relative bg-white p-8 rounded-3xl shadow-xl ring-1 ring-black/5">
                    <MessageCircle className="h-16 w-16 text-primary" />
                </div>
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Suas Mensagens</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Conecte-se com seus mentores e mentorados em tempo real. Selecione uma conversa ao lado para começar.
              </p>
              <div className="mt-10 grid grid-cols-2 gap-4 w-full">
                  <div className="p-4 bg-muted/30 rounded-2xl text-left">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm mb-3">
                          <Archive className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-xs font-bold text-gray-900">Privacidade</p>
                      <p className="text-[10px] text-muted-foreground">Arquive conversas antigas para manter seu foco.</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-2xl text-left">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm mb-3">
                          <MessageCircle className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-xs font-bold text-gray-900">Realtime</p>
                      <p className="text-[10px] text-muted-foreground">Mensagens instantâneas e notificações nativas.</p>
                  </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Chat Fullscreen */}
        {selectedConversation && (
          <div className="md:hidden fixed inset-0 bg-background z-50 flex flex-col">
            <div className="p-3 border-b flex items-center justify-between gap-3 bg-white">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setSelectedConversation(null)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedConversation.other_user.avatar_url || ""} />
                  <AvatarFallback>{selectedConversation.other_user.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <h2 className="font-bold text-sm truncate max-w-[150px]">{selectedConversation.other_user.full_name}</h2>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem onClick={() => toggleArchive(selectedConversation.id)} className="flex items-center gap-2">
                    <Archive className="h-4 w-4" /> Arquivar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatInterface 
                key={`mobile-${selectedConversation.id}`} 
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
