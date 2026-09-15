import { createClient } from '@/lib/utils/supabase/server'
import { createServiceRoleClient } from '@/lib/utils/supabase/service-role'
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
  const { error: updateError } = await (supabase
    .from('profiles') as any)
    .update({
      verification_status: status,
      verification_notes: notes,
      verified_at: status === 'approved' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
      verified: status === 'approved',
      is_pending_mentor: status === 'pending'
    })
    .eq('id', userId)

  if (updateError) throw new Error(`Erro ao atualizar perfil: ${updateError.message}`)

  // 1b. Assign/remove the RBAC "mentor" role.
  // This queue is fed exclusively by mentor requests (both onboarding's
  // POST /api/profile/role and the profile page's POST
  // /api/profile/request-mentor set verification_status = 'pending').
  // Approving one here previously only ever touched `profiles` columns —
  // it never wrote to user_roles, so an approved mentor's isMentor stayed
  // false everywhere in the app (dashboard, availability setup, and the
  // public mentors directory all read the RBAC role, not
  // verification_status). Uses the service-role client because this is a
  // cross-user write with no confirmed RLS policy letting an admin's own
  // session modify someone else's user_roles rows — same reasoning as
  // every other cross-user admin mutation in this codebase
  // (app/api/admin/users/[id]/route.ts, etc).
  if (status === 'approved') {
    const serviceClient = createServiceRoleClient()
    const { data: exclusiveRoles } = await serviceClient
      .from('roles')
      .select('id, name')
      .in('name', ['mentor', 'mentee'])

    const mentorRoleId = (exclusiveRoles ?? []).find((r: any) => r.name === 'mentor')?.id
    const menteeRoleId = (exclusiveRoles ?? []).find((r: any) => r.name === 'mentee')?.id

    if (menteeRoleId) {
      await serviceClient.from('user_roles').delete().eq('user_id', userId).eq('role_id', menteeRoleId)
    }
    if (mentorRoleId) {
      // user_roles has no unique constraint on (user_id, role_id) — its
      // primary key is a synthetic `id` — so `.upsert(..., { onConflict:
      // "user_id,role_id" })` fails outright with Postgres error 42P10.
      // Confirmed directly against the live database. Check-then-insert
      // instead of relying on upsert.
      const { data: existingRole } = await serviceClient
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role_id', mentorRoleId)
        .maybeSingle()

      if (!existingRole) {
        await serviceClient.from('user_roles').insert({ user_id: userId, role_id: mentorRoleId })
      }
    }
  }

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
    // Silently log in server only if necessary
  }

  return { success: true }
}
