/**
 * @jest-environment node
 */
import { processVerification } from './notification.service'
import { createClient } from '@/lib/utils/supabase/server'
import { createServiceRoleClient } from '@/lib/utils/supabase/service-role'
import { getOrCreateConversation, sendMessage } from '@/lib/chat/chat-service'
import { sendVerificationNotification } from '@/lib/email/brevo'

jest.mock('@/lib/utils/supabase/server', () => ({
  createClient: jest.fn()
}))

jest.mock('@/lib/utils/supabase/service-role', () => ({
  createServiceRoleClient: jest.fn()
}))

jest.mock('@/lib/email/brevo', () => ({
  sendVerificationNotification: jest.fn().mockResolvedValue(undefined)
}))

jest.mock('@/lib/chat/chat-service', () => ({
  getOrCreateConversation: jest.fn().mockResolvedValue('conv-1'),
  sendMessage: jest.fn().mockResolvedValue(undefined)
}))

describe('processVerification', () => {
  let mockCookieSupabase: any
  let mockServiceSupabase: any
  let userRolesDelete: jest.Mock
  let userRolesUpsert: jest.Mock
  let profilesUpdate: jest.Mock
  let profileRow: any

  const profilesTable = () => ({ update: profilesUpdate })

  beforeEach(() => {
    jest.clearAllMocks()

    profileRow = { id: 'mentor-1', email: 'mentor@x.com', full_name: 'Mentor Um' }
    profilesUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockImplementation(() => Promise.resolve({ data: profileRow, error: null }))
        })
      })
    })

    mockCookieSupabase = { from: jest.fn() }
    ;(createClient as jest.Mock).mockResolvedValue(mockCookieSupabase)

    userRolesDelete = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) })
    })
    userRolesUpsert = jest.fn().mockResolvedValue({ error: null })

    mockServiceSupabase = {
      from: jest.fn((table: string) => {
        if (table === 'profiles') return profilesTable()
        if (table === 'roles') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({
                data: [
                  { id: 1, name: 'mentee' },
                  { id: 2, name: 'mentor' }
                ],
                error: null
              })
            })
          }
        }
        if (table === 'user_roles') {
          return {
            delete: userRolesDelete,
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
                })
              })
            }),
            insert: userRolesUpsert
          }
        }
        return {}
      })
    }
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockServiceSupabase)
  })

  it('assigns the mentor RBAC role and drops mentee when approved', async () => {
    // Regression test: approving a pending mentor request used to only
    // update `profiles` columns. isMentor is derived from user_roles
    // everywhere in the app (dashboard routing, availability setup, the
    // public mentors directory), so an "approved" mentor from this flow
    // was never actually recognized as a mentor anywhere.
    await processVerification({
      userId: 'mentor-1',
      adminId: 'admin-1',
      status: 'approved',
      notes: 'ok'
    })

    expect(createServiceRoleClient).toHaveBeenCalled()
    expect(userRolesUpsert).toHaveBeenCalledWith({ user_id: 'mentor-1', role_id: 2 })
    expect(userRolesDelete).toHaveBeenCalled()
  })

  it('does not insert a duplicate mentor row when one already exists', async () => {
    // Regression test: user_roles has no unique constraint on
    // (user_id, role_id) — its primary key is a synthetic `id` — so
    // `.upsert(..., { onConflict: "user_id,role_id" })` fails outright with
    // Postgres error 42P10, confirmed directly against the live database.
    // The fix checks for an existing row first; this must not insert when
    // the mentor role is already assigned.
    mockServiceSupabase.from = jest.fn((table: string) => {
      if (table === 'profiles') return profilesTable()
      if (table === 'roles') {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [
                { id: 1, name: 'mentee' },
                { id: 2, name: 'mentor' }
              ],
              error: null
            })
          })
        }
      }
      if (table === 'user_roles') {
        return {
          delete: userRolesDelete,
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'existing-row' }, error: null })
              })
            })
          }),
          insert: userRolesUpsert
        }
      }
      return {}
    })

    await processVerification({
      userId: 'mentor-1',
      adminId: 'admin-1',
      status: 'approved',
      notes: 'ok'
    })

    expect(userRolesUpsert).not.toHaveBeenCalled()
  })

  it('does not touch user_roles when rejected', async () => {
    await processVerification({
      userId: 'mentor-1',
      adminId: 'admin-1',
      status: 'rejected',
      notes: 'incompleto'
    })

    expect(mockServiceSupabase.from).not.toHaveBeenCalledWith('user_roles')
  })

  it('updates the profile with the service-role client and publishes it on approval', async () => {
    // Regression test: the update used the admin's own session, and
    // `profiles` has no admin UPDATE policy — RLS matched zero rows without
    // an error, so the approval "succeeded" but the profile stayed pending
    // and hidden from /mentors (Bianca Dias, 2026-09-25).
    await processVerification({ userId: 'mentor-1', adminId: 'admin-1', status: 'approved' })

    expect(mockCookieSupabase.from).not.toHaveBeenCalledWith('profiles')
    expect(profilesUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        verification_status: 'approved',
        verified: true,
        is_public: true,
        is_pending_mentor: false
      })
    )
  })

  it('throws when no profile row was updated', async () => {
    profileRow = null
    await expect(
      processVerification({ userId: 'ghost', adminId: 'admin-1', status: 'approved' })
    ).rejects.toThrow('Perfil não encontrado')
    expect(sendMessage).not.toHaveBeenCalled()
  })

  it('sends the e-mail by default and skips it when notifyEmail is false', async () => {
    await processVerification({ userId: 'mentor-1', adminId: 'admin-1', status: 'rejected', notes: 'foto' })
    expect(sendVerificationNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userEmail: 'mentor@x.com', status: 'rejected', notes: 'foto' })
    )

    ;(sendVerificationNotification as jest.Mock).mockClear()
    await processVerification({ userId: 'mentor-1', adminId: 'admin-1', status: 'approved', notifyEmail: false })
    expect(sendVerificationNotification).not.toHaveBeenCalled()
  })

  it('sends a chat notification after the profile update', async () => {
    await processVerification({
      userId: 'mentor-1',
      adminId: 'admin-1',
      status: 'approved',
      notes: 'ok'
    })

    expect(getOrCreateConversation).toHaveBeenCalledWith(mockCookieSupabase, 'mentor-1', 'admin-1')
    expect(sendMessage).toHaveBeenCalled()
  })

  it('sends the admin-written message verbatim instead of the default text', async () => {
    await processVerification({
      userId: 'mentor-1',
      adminId: 'admin-1',
      status: 'approved',
      notes: 'interno',
      message: 'Oi, Bianca! Seu perfil foi aprovado.'
    })

    expect(sendMessage).toHaveBeenCalledWith(mockCookieSupabase, 'conv-1', 'admin-1', 'Oi, Bianca! Seu perfil foi aprovado.')
  })
})
