'use client'

import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2Icon, SendIcon, SearchIcon, MessageSquareIcon, UserIcon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useTranslation } from 'react-i18next'

// Mock data for conversations and messages
interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  participantIds: string[];
  lastMessage: Message;
  unreadCount: number;
}

const mockUsers = {
  'user1': { id: 'user1', name: 'Alice Johnson', avatar: '/placeholder-user.jpg' },
  'user2': { id: 'user2', name: 'Bob Williams', avatar: '/placeholder-user.jpg' },
  'user3': { id: 'user3', name: 'Charlie Brown', avatar: '/placeholder-user.jpg' },
  'user4': { id: 'user4', name: 'Diana Prince', avatar: '/placeholder-user.jpg' },
}

const mockConversations: Conversation[] = [
  {
    id: 'conv1',
    participantIds: ['user1', 'user2'],
    lastMessage: { id: 'msg5', senderId: 'user2', text: 'Great, see you then!', timestamp: '2023-10-27T10:30:00Z' },
    unreadCount: 1,
  },
  {
    id: 'conv2',
    participantIds: ['user1', 'user3'],
    lastMessage: { id: 'msg8', senderId: 'user1', text: 'I\'ll send you the details soon.', timestamp: '2023-10-26T15:00:00Z' },
    unreadCount: 0,
  },
  {
    id: 'conv3',
    participantIds: ['user1', 'user4'],
    lastMessage: { id: 'msg10', senderId: 'user4', text: 'Thanks for the session!', timestamp: '2023-10-25T09:00:00Z' },
    unreadCount: 0,
  },
]

const mockMessages: { [key: string]: Message[] } = {
  'conv1': [
    { id: 'msg1', senderId: 'user1', text: 'Hi Bob, how are you?', timestamp: '2023-10-27T09:00:00Z' },
    { id: 'msg2', senderId: 'user2', text: 'I\'m good, Alice! Ready for our session?', timestamp: '2023-10-27T09:05:00Z' },
    { id: 'msg3', senderId: 'user1', text: 'Yes, looking forward to it!', timestamp: '2023-10-27T09:10:00Z' },
    { id: 'msg4', senderId: 'user2', text: 'Just confirming the time for tomorrow.', timestamp: '2023-10-27T10:00:00Z' },
    { id: 'msg5', senderId: 'user2', text: 'Great, see you then!', timestamp: '2023-10-27T10:30:00Z' },
  ],
  'conv2': [
    { id: 'msg6', senderId: 'user3', text: 'Hey Charlie, about the project...', timestamp: '2023-10-26T14:00:00Z' },
    { id: 'msg7', senderId: 'user1', text: 'Sure, what\'s up?', timestamp: '2023-10-26T14:30:00Z' },
    { id: 'msg8', senderId: 'user1', text: 'I\'ll send you the details soon.', timestamp: '2023-10-26T15:00:00Z' },
  ],
  'conv3': [
    { id: 'msg9', senderId: 'user1', text: 'Thanks for the great session, Diana!', timestamp: '2023-10-25T08:45:00Z' },
    { id: 'msg10', senderId: 'user4', text: 'Thanks for the session!', timestamp: '2023-10-25T09:00:00Z' },
  ],
}

export default function MessagesPage() {
  const { t } = useTranslation()
  const { user, isLoading: authLoading } = useAuth()
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [currentMessages, setCurrentMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // Simulate fetching conversations
  useEffect(() => {
    if (user) {
      // In a real app, fetch conversations for the current user
      // For mock, filter conversations where 'user1' is the current user
      setConversations(mockConversations.filter(conv => conv.participantIds.includes('user1')))
    }
  }, [user])

  // Simulate fetching messages for a selected conversation
  useEffect(() => {
    if (selectedConversation) {
      setLoadingMessages(true)
      // Simulate API call
      setTimeout(() => {
        setCurrentMessages(mockMessages[selectedConversation.id] || [])
        setLoadingMessages(false)
      }, 500)
    } else {
      setCurrentMessages([])
    }
  }, [selectedConversation])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim() && selectedConversation && user) {
      const message: Message = {
        id: `msg${Date.now()}`,
        senderId: user.id, // Assuming user.id maps to 'user1' for mock data
        text: newMessage.trim(),
        timestamp: new Date().toISOString(),
      }
      setCurrentMessages((prev) => [...prev, message])
      setNewMessage('')
      // In a real app, send message to backend and update lastMessage in conversation
    }
  }

  const getParticipantInfo = (conversation: Conversation) => {
    const otherParticipantId = conversation.participantIds.find(id => id !== 'user1') // Assuming 'user1' is current user
    return mockUsers[otherParticipantId as keyof typeof mockUsers] || { name: 'Unknown User', avatar: '/placeholder-user.jpg' }
  }

  const filteredConversations = useMemo(() => {
    if (!searchTerm) return conversations
    return conversations.filter(conv => {
      const participant = getParticipantInfo(conv)
      return participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             conv.lastMessage.text.toLowerCase().includes(searchTerm.toLowerCase())
    })
  }, [conversations, searchTerm])

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2Icon className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t('common.loading')}</span>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['mentee', 'mentor', 'admin']}>
      <div className="container mx-auto px-4 py-8 md:py-12 h-[calc(100vh-150px)] flex flex-col">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">
          {t('messagesPage.title')}
        </h1>

        <div className="flex flex-1 min-h-0 gap-6">
          {/* Conversation List */}
          <Card className="w-full md:w-1/3 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareIcon className="h-6 w-6" /> {t('messagesPage.conversations')}
              </CardTitle>
            </CardHeader>
            <div className="p-4 border-b">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('messagesPage.searchConversations')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <ScrollArea className="flex-1 p-4">
              {filteredConversations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">{t('messagesPage.noConversations')}</p>
              ) : (
                filteredConversations.map((conv) => {
                  const participant = getParticipantInfo(conv)
                  return (
                    <div
                      key={conv.id}
                      className={`flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-muted transition-colors ${
                        selectedConversation?.id === conv.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedConversation(conv)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={participant.avatar || "/placeholder.svg"} alt={participant.name} />
                        <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <p className="font-medium">{participant.name}</p>
                          {conv.unreadCount > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.lastMessage.text}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </ScrollArea>
          </Card>

          {/* Message Area */}
          <Card className="w-full md:w-2/3 flex flex-col">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={getParticipantInfo(selectedConversation).avatar || "/placeholder.svg"} alt={getParticipantInfo(selectedConversation).name} />
                      <AvatarFallback>{getParticipantInfo(selectedConversation).name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <CardTitle>{getParticipantInfo(selectedConversation).name}</CardTitle>
                  </div>
                </CardHeader>
                <ScrollArea className="flex-1 p-4">
                  {loadingMessages ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2Icon className="h-8 w-8 animate-spin" />
                      <span className="ml-2">{t('messagesPage.loadingMessages')}</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {currentMessages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex items-end gap-2",
                            message.senderId === 'user1' ? 'justify-end' : 'justify-start' // Assuming 'user1' is current user
                          )}
                        >
                          {message.senderId !== 'user1' && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={mockUsers[message.senderId as keyof typeof mockUsers]?.avatar || '/placeholder-user.jpg'} />
                              <AvatarFallback>{mockUsers[message.senderId as keyof typeof mockUsers]?.name.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={cn(
                              "rounded-lg p-3 max-w-[70%]",
                              message.senderId === 'user1'
                                ? 'bg-primary text-primary-foreground rounded-br-none'
                                : 'bg-muted rounded-bl-none'
                            )}
                          >
                            <p className="text-sm">{message.text}</p>
                            <p className="text-xs text-right mt-1 opacity-70">
                              {format(new Date(message.timestamp), 'HH:mm')}
                            </p>
                          </div>
                          {message.senderId === 'user1' && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={mockUsers[message.senderId as keyof typeof mockUsers]?.avatar || '/placeholder-user.jpg'} />
                              <AvatarFallback>{mockUsers[message.senderId as keyof typeof mockUsers]?.name.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center gap-2">
                  <Input
                    placeholder={t('messagesPage.typeMessage')}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                    disabled={loadingMessages}
                  />
                  <Button type="submit" size="icon" disabled={loadingMessages || !newMessage.trim()}>
                    <SendIcon className="h-4 w-4" />
                    <span className="sr-only">{t('messagesPage.sendMessage')}</span>
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <MessageSquareIcon className="h-20 w-20 mb-4" />
                <p className="text-lg">{t('messagesPage.selectConversation')}</p>
                <p className="text-sm">{t('messagesPage.selectConversationDescription')}</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
