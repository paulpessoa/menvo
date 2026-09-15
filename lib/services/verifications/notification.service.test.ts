/**
 * @jest-environment node
 */
import { processVerification } from './notification.service'
import { createClient } from '@/lib/utils/supabase/server'
import { createServiceRoleClient } from '@/lib/utils/supabase/service-role'
import { getOrCreateConversation, sendMessage } from '@/lib/chat/chat-service'

jest.mock('@/lib/utils/supabase/server', () => ({
  createClient: jest.fn()
}))

jest.mock('@/lib/utils/supabase/service-role', () => ({
  createServiceRoleClient: jest.fn()
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

  beforeEach(() => {
    jest.clearAllMocks()

    mockCookieSupabase = {
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      })
    }
    ;(createClient as jest.Mock).mockResolvedValue(mockCookieSupabase)

    userRolesDelete = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) })
    })
    userRolesUpsert = jest.fn().mockResolvedValue({ error: null })

    mockServiceSupabase = {
      from: jest.fn((table: string) => {
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

    expect(createServiceRoleClient).not.toHaveBeenCalled()
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
})
