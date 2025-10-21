/**
 * Chat Service - Supabase Realtime
 * Serviço para gerenciar conversas e mensagens em tempo real
 */

import { createClient } from '@/lib/supabase';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  mentor_id: string;
  mentee_id: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Busca ou cria uma conversa entre mentor e mentee
 */
export async function getOrCreateConversation(
  mentorId: string,
  menteeId: string
): Promise<string> {
  const supabase = createClient();

  console.log('[CHAT SERVICE] Buscando conversa:', { mentorId, menteeId });

  // Tentar buscar conversa existente
  const { data: existingConversation, error: fetchError } = await supabase
    .from('conversations')
    .select('id')
    .eq('mentor_id', mentorId)
    .eq('mentee_id', menteeId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 = not found, é esperado
    console.error('[CHAT SERVICE] Erro ao buscar conversa:', fetchError);
  }

  if (existingConversation) {
    console.log('[CHAT SERVICE] Conversa existente encontrada:', existingConversation.id);
    return existingConversation.id;
  }

  console.log('[CHAT SERVICE] Criando nova conversa...');

  // Se não existe, criar nova conversa
  const { data: newConversation, error: createError } = await supabase
    .from('conversations')
    .insert({
      mentor_id: mentorId,
      mentee_id: menteeId,
    })
    .select('id')
    .single();

  if (createError) {
    console.error('[CHAT SERVICE] Erro ao criar conversa:', createError);
    throw new Error(`Erro ao criar conversa: ${createError.message}`);
  }

  console.log('[CHAT SERVICE] Nova conversa criada:', newConversation.id);
  return newConversation.id;
}

/**
 * Envia uma mensagem em uma conversa
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<Message> {
  const supabase = createClient();

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error('[CHAT] Erro ao enviar mensagem:', error);
    throw new Error('Erro ao enviar mensagem');
  }

  return message;
}

/**
 * Busca mensagens de uma conversa
 */
export async function getMessages(
  conversationId: string,
  limit: number = 50
): Promise<Message[]> {
  const supabase = createClient();

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[CHAT] Erro ao buscar mensagens:', error);
    throw new Error('Erro ao buscar mensagens');
  }

  return messages || [];
}

/**
 * Marca mensagens como lidas
 */
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .is('read_at', null);

  if (error) {
    console.error('[CHAT] Erro ao marcar mensagens como lidas:', error);
  }
}

/**
 * Conta mensagens não lidas em uma conversa
 */
export async function getUnreadCount(
  conversationId: string,
  userId: string
): Promise<number> {
  const supabase = createClient();

  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .is('read_at', null);

  if (error) {
    console.error('[CHAT] Erro ao contar mensagens não lidas:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Busca conversas do usuário
 */
export async function getUserConversations(
  userId: string
): Promise<Conversation[]> {
  const supabase = createClient();

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('[CHAT] Erro ao buscar conversas:', error);
    throw new Error('Erro ao buscar conversas');
  }

  return conversations || [];
}
