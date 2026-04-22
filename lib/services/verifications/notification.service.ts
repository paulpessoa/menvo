import { createClient } from '@/lib/utils/supabase/server'
import { getOrCreateConversation, sendMessage } from '@/lib/chat/chat-service'

export type VerificationStatus = 'approved' | 'rejected' | 'pending'

export interface VerificationOptions {
  userId: string
  adminId: string
  status: VerificationStatus
  notes?: string
}

/**
 * Service to handle user verification and automatic notifications
 */
export async function processVerification({
  userId,
  adminId,
  status,
  notes
}: VerificationOptions) {
  const supabase = await createClient()

  // 1. Update Profile Status
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      verification_status: status,
      verification_notes: notes,
      verified_at: status === 'approved' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
      // Auto-publish if approved
      published: status === 'approved'
    })
    .eq('id', userId)

  if (updateError) throw new Error(`Erro ao atualizar perfil: ${updateError.message}`)

  // 2. Send Chat Notification
  try {
    const conversationId = await getOrCreateConversation(supabase, userId, adminId)
    
    let messageContent = ''
    if (status === 'approved') {
      messageContent = '🎉 Parabéns! Seu perfil foi verificado e aprovado. Agora você já pode ser encontrado na plataforma Menvo.'
    } else {
      messageContent = '📢 Olá! Analisamos seu perfil e precisamos de alguns ajustes antes da aprovação definitiva.'
    }

    if (notes) {
      messageContent += `\n\nNotas do administrador:\n${notes}`
    }

    await sendMessage(supabase, conversationId, adminId, messageContent)
  } catch (chatError) {
    console.error('[VERIFICATION SERVICE] Erro ao enviar notificação via chat:', chatError)
    // Don't fail the whole process if chat notification fails
  }

  return { success: true }
}
