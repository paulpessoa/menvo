import { createClient } from '@/lib/utils/supabase/server'
import { createServiceRoleClient } from '@/lib/utils/supabase/service-role'
import { getOrCreateConversation, sendMessage } from '@/lib/chat/chat-service'
import { sendVerificationNotification } from '@/lib/email/brevo'

export type VerificationStatus = 'approved' | 'rejected' | 'pending'

export interface VerificationOptions {
  userId: string
  adminId: string
  status: VerificationStatus
  notes?: string
  /** Full chat message written by the admin (e.g. an edited AI draft); replaces the default text. */
  message?: string
  /** Also send the Brevo e-mail (default true). Only applies to approved/rejected. */
  notifyEmail?: boolean
}

export interface VerificationResult {
  success: true
  chatSent: boolean
  emailSent: boolean
}

/**
 * Profile columns written for each decision. `verification_status` is the
 * single source of truth; the DB trigger `sync_profile_verification_flags`
 * keeps `is_pending_mentor`/`verified` in sync, but we still send them so the
 * write is correct even before that migration runs.
 *
 * Approval also publishes the profile (`is_public`): the mentor directory only
 * lists public profiles, and the approval message tells the mentor they are
 * already listed. The mentor can hide it again from their own profile page.
 */
function buildProfileUpdate(status: VerificationStatus, notes?: string) {
  const now = new Date().toISOString()
  const base = {
    verification_status: status,
    verification_notes: notes ?? null,
    is_pending_mentor: status === 'pending',
    updated_at: now
  }
  if (status === 'approved') {
    return { ...base, verified: true, verified_at: now, is_public: true }
  }
  return base
}

/**
 * The one place a mentor application is decided — used by both
 * /dashboard/admin/verifications and the user modal in /dashboard/admin/users
 * (via POST /api/admin/verify), so both screens produce the same profile
 * state, RBAC role, chat message and e-mail.
 *
 * Cross-user writes use the service-role client: `profiles` has no admin
 * UPDATE policy, so the admin's own session silently updated zero rows
 * (the approval looked successful but the profile stayed "pending").
 * Callers must be guarded by `requireAdmin()`.
 */
export async function processVerification({
  userId,
  adminId,
  status,
  notes,
  message,
  notifyEmail = true
}: VerificationOptions): Promise<VerificationResult> {
  const supabase = await createClient()
  const serviceClient = createServiceRoleClient()

  // 1. Update profile — and fail loudly if no row was touched.
  const { data: updated, error: updateError } = await (serviceClient
    .from('profiles') as any)
    .update(buildProfileUpdate(status, notes))
    .eq('id', userId)
    .select('id, email, full_name')
    .maybeSingle()

  if (updateError) throw new Error(`Erro ao atualizar perfil: ${updateError.message}`)
  if (!updated) throw new Error('Perfil não encontrado')

  // 2. Approval grants the RBAC "mentor" role. isMentor, the dashboard and
  // `mentors_view` (the public directory) all read user_roles, not profile
  // columns. mentor/mentee are exclusive (see /api/profile/role).
  if (status === 'approved') {
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
      // user_roles has no unique (user_id, role_id) constraint, so upsert
      // with onConflict fails (42P10) — check-then-insert instead.
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

  // 3. Chat message (sent from the admin's own session so it shows as them).
  let chatSent = false
  try {
    const conversationId = await getOrCreateConversation(supabase, userId, adminId)

    let messageContent = message
    if (!messageContent) {
      messageContent = status === 'approved'
        ? '🎉 Parabéns! Seu perfil foi verificado e aprovado. Agora você já pode ser encontrado na plataforma Menvo.'
        : '📢 Olá! Analisamos seu perfil e precisamos de alguns ajustes antes da aprovação definitiva.'
      if (notes) messageContent += `\n\nNotas do administrador:\n${notes}`
    }

    await sendMessage(supabase, conversationId, adminId, messageContent)
    chatSent = true
  } catch (chatError) {
    console.error('[VERIFICATION] Falha ao enviar mensagem no chat:', chatError)
  }

  // 4. E-mail (Brevo).
  let emailSent = false
  if (notifyEmail && status !== 'pending' && updated.email) {
    try {
      await sendVerificationNotification({
        userEmail: updated.email,
        userName: updated.full_name || 'Mentor',
        status,
        notes: message || notes
      })
      emailSent = true
    } catch (emailError) {
      console.error('[VERIFICATION] Falha ao enviar e-mail:', emailError)
    }
  }

  return { success: true, chatSent, emailSent }
}
