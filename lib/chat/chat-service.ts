/**
 * Chat Service - Supabase Realtime
 * Serviço para gerenciar conversas e mensagens em tempo real
 */

import { SupabaseClient } from '@supabase/supabase-js';

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
  supabase: SupabaseClient,
  mentorId: string,
  menteeId: string
): Promise<string> {

  console.log('[CHAT SERVICE] Buscando conversa:', { mentorId, menteeId });

  // Tentar buscar conversa existente (em qualquer ordem)
  const { data: existingConversations, error: fetchError } = await supabase
    .from('conversations')
    .select('id')
    .or(`and(mentor_id.eq.${mentorId},mentee_id.eq.${menteeId}),and(mentor_id.eq.${menteeId},mentee_id.eq.${mentorId})`);

  if (fetchError) {
    console.error('[CHAT SERVICE] Erro ao buscar conversa:', fetchError);
  }

  if (existingConversations && existingConversations.length > 0) {
    console.log('[CHAT SERVICE] Conversa existente encontrada:', existingConversations[0].id);
    return existingConversations[0].id;
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
  supabase: SupabaseClient,
  conversationId: string,
  senderId: string,
  content: string
): Promise<Message> {

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
  supabase: SupabaseClient,
  conversationId: string,
  limit: number = 50
): Promise<Message[]> {

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
  supabase: SupabaseClient,
  conversationId: string,
  userId: string
): Promise<void> {

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
  supabase: SupabaseClient,
  conversationId: string,
  userId: string
): Promise<number> {

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
  supabase: SupabaseClient,
  userId: string
): Promise<Conversation[]> {

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
