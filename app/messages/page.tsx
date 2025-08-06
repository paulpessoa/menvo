'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useUserProfile } from '@/hooks/useUserProfile'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, SendIcon, MessageSquareIcon, SearchIcon, UserIcon } from 'lucide-react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/database'

type Message = Database['public']['Tables']['messages']['Row'];
type Conversation = {
  id: string;
  otherUser: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  lastMessage: Message | null;
};

export default function MessagesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { userProfile, loading: profileLoading } = useUserProfile(user?.id)
  const supabase = createClient()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const currentUserId = user?.id

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUserId) return

      setLoadingConversations(true)
      try {
        // Fetch all messages involving the current user
        const { data: allMessages, error: messagesError } = await supabase
          .from('messages')
          .select(`
            *,
            sender_profile:sender_id (id, full_name, avatar_url),
            receiver_profile:receiver_id (id, full_name, avatar_url)
          `)
          .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
          .order('created_at', { ascending: false })

        if (messagesError) throw messagesError

        const convMap = new Map<string, Conversation>()

        allMessages.forEach(msg => {
          const otherUser = msg.sender_id === currentUserId ? msg.receiver_profile : msg.sender_profile
          if (!otherUser) return // Should not happen if profiles exist

          const conversationKey = [currentUserId, otherUser.id].sort().join('-')

          if (!convMap.has(conversationKey)) {
            convMap.set(conversationKey, {
              id: conversationKey,
              otherUser: {
                id: otherUser.id,
                full_name: otherUser.full_name,
                avatar_url: otherUser.avatar_url,
              },
              lastMessage: msg,
            })
          } else {
            // Update last message if it's newer
            const existingConv = convMap.get(conversationKey)!
            if (new Date(msg.created_at) > new Date(existingConv.lastMessage?.created_at || 0)) {
              existingConv.lastMessage = msg
            }
          }
        })

        setConversations(Array.from(convMap.values()).sort((a, b) =>
          new Date(b.lastMessage?.created_at || 0).getTime() - new Date(a.lastMessage?.created_at || 0).getTime()
        ))

      } catch (error) {
        console.error('Error fetching conversations:', error)
        toast({
          title: 'Erro ao carregar conversas',
          description: 'Não foi possível carregar suas conversas.',
          variant: 'destructive',
        })
      } finally {
        setLoadingConversations(false)
      }
    }

    fetchConversations()
  }, [currentUserId, supabase])

  // Fetch messages for selected conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversationId || !currentUserId) {
        setMessages([])
        return
      }

      setLoadingMessages(true)
      try {
        const [user1Id, user2Id] = selectedConversationId.split('-')

        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender_profile:sender_id (id, full_name, avatar_url)
          `)
          .or(`and(sender_id.eq.${user1Id},receiver_id.eq.${user2Id}),and(sender_id.eq.${user2Id},receiver_id.eq.${user1Id})`)
          .order('created_at', { ascending: true })

        if (error) throw error
        setMessages(data || [])
      } catch (error) {
        console.error('Error fetching messages:', error)
        toast({
          title: 'Erro ao carregar mensagens',
          description: 'Não foi possível carregar as mensagens desta conversa.',
          variant: 'destructive',
        })
      } finally {
        setLoadingMessages(false)
      }
    }

    fetchMessages()

    // Realtime listener for new messages in the selected conversation
    const channel = supabase
      .channel(`messages:${selectedConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversationId}`, // Assuming a conversation_id column
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prevMessages) => [...prevMessages, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversationId, currentUserId, supabase])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId || !currentUserId) return

    const [user1Id, user2Id] = selectedConversationId.split('-')
    const receiverId = user1Id === currentUserId ? user2Id : user1Id

    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: currentUserId,
        receiver_id: receiverId,
        content: newMessage.trim(),
        conversation_id: selectedConversationId, // Store conversation ID
      })

      if (error) throw error
      setNewMessage('')
      // Messages will be updated by the real-time listener
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: 'Erro ao enviar mensagem',
        description: 'Não foi possível enviar sua mensagem.',
        variant: 'destructive',
      })
    }
  }

  const filteredConversations = useMemo(() => {
    return conversations.filter(conv =>
      conv.otherUser.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.otherUser.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [conversations, searchTerm])

  const selectedConversation = useMemo(() => {
    return conversations.find(conv => conv.id === selectedConversationId)
  }, [conversations, selectedConversationId])

  if (authLoading || profileLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando mensagens...</span>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['mentee', 'mentor', 'admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12 h-[calc(100vh-150px)] flex flex-col">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">Mensagens</h1>

        <Card className="flex flex-grow overflow-hidden">
          {/* Conversation List */}
          <div className="w-1/3 border-r flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Conversas</CardTitle>
              <div className="relative mt-2">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar conversas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <ScrollArea className="flex-grow">
              <CardContent className="p-0">
                {loadingConversations ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredConversations.length > 0 ? (
                  filteredConversations.map(conv => (
                    <div
                      key={conv.id}
                      className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-muted ${selectedConversationId === conv.id ? 'bg-muted' : ''}`}
                      onClick={() => setSelectedConversationId(conv.id)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conv.otherUser.avatar_url || '/placeholder-user.jpg'} alt={conv.otherUser.full_name || 'User'} />
                        <AvatarFallback>{conv.otherUser.full_name?.charAt(0) || conv.otherUser.id.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-grow">
                        <p className="font-semibold">{conv.otherUser.full_name || 'Usuário Desconhecido'}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.lastMessage?.content || 'Nenhuma mensagem.'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground p-4">Nenhuma conversa encontrada.</p>
                )}
              </CardContent>
            </ScrollArea>
          </div>

          {/* Message Area */}
          <div className="w-2/3 flex flex-col">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b pb-3">
                  <CardTitle className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedConversation.otherUser.avatar_url || '/placeholder-user.jpg'} alt={selectedConversation.otherUser.full_name || 'User'} />
                      <AvatarFallback>{selectedConversation.otherUser.full_name?.charAt(0) || selectedConversation.otherUser.id.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {selectedConversation.otherUser.full_name || 'Usuário Desconhecido'}
                  </CardTitle>
                </CardHeader>
                <ScrollArea className="flex-grow p-4">
                  {loadingMessages ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              msg.sender_id === currentUserId
                                ? 'bg-primary text-primary-foreground rounded-br-none'
                                : 'bg-muted rounded-bl-none'
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <span className="block text-xs text-right mt-1 opacity-75">
                              {format(new Date(msg.created_at), 'HH:mm')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground p-4">Comece uma conversa!</p>
                  )}
                </ScrollArea>
                <div className="border-t p-4 flex items-center gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleSendMessage()
                    }}
                    className="flex-grow"
                  />
                  <Button onClick={handleSendMessage}>
                    <SendIcon className="h-5 w-5" />
                    <span className="sr-only">Enviar</span>
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageSquareIcon className="h-16 w-16 mb-4" />
                <p className="text-lg">Selecione uma conversa para começar a conversar.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
