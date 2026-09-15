/**
 * @jest-environment node
 */
import { POST } from './route'
import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createClient } from '@/lib/utils/supabase/server'
import { createServiceRoleClient } from '@/lib/utils/supabase/service-role'
import { sendWaitingListAccountInvite } from '@/lib/email/brevo'

jest.mock('@/lib/auth/require-admin', () => ({ requireAdmin: jest.fn() }))
jest.mock('@/lib/utils/supabase/server', () => ({ createClient: jest.fn() }))
jest.mock('@/lib/utils/supabase/service-role', () => ({ createServiceRoleClient: jest.fn() }))
jest.mock('@/lib/email/brevo', () => ({ sendWaitingListAccountInvite: jest.fn() }))

const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>

function makeRequest(body: any) {
  return new NextRequest('http://localhost:3000/api/admin/waiting-list/create-account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

describe('POST /api/admin/waiting-list/create-account', () => {
  let mockCookieSupabase: any
  let mockServiceSupabase: any
  let profileUpdateEq: jest.Mock
  let waitingListUpdateEq: jest.Mock
  let createUser: jest.Mock
  let generateLink: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({ ok: true, admin: { userId: 'admin-1', role: 'admin' } })
    ;(sendWaitingListAccountInvite as jest.Mock).mockResolvedValue({ success: true })

    waitingListUpdateEq = jest.fn().mockResolvedValue({ error: null })
    mockCookieSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { name: 'Amanda Oliveira', email: 'amanda@example.com', whatsapp: '81999998888', reason: 'Quero migrar para RH' },
              error: null
            })
          })
        }),
        update: jest.fn().mockReturnValue({ eq: waitingListUpdateEq })
      })
    }
    ;(createClient as jest.Mock).mockResolvedValue(mockCookieSupabase)

    profileUpdateEq = jest.fn().mockResolvedValue({ error: null })
    createUser = jest.fn()
    generateLink = jest.fn().mockResolvedValue({
      data: {
        user: { id: 'new-user-1' },
        properties: { action_link: 'https://project.supabase.co/auth/v1/verify?token=abc&type=invite' }
      },
      error: null
    })

    mockServiceSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) // no existing profile by default
          })
        }),
        update: jest.fn().mockReturnValue({ eq: profileUpdateEq })
      }),
      auth: { admin: { createUser, generateLink } }
    }
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockServiceSupabase)
  })

  it('rejects non-admins', async () => {
    const { NextResponse } = await import('next/server')
    mockRequireAdmin.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    })

    const res = await POST(makeRequest({ waitingListId: 'wl-1' }))

    expect(res.status).toBe(403)
    expect(createUser).not.toHaveBeenCalled()
  })

  it('creates a new account via generateLink alone, prefills the profile, and sends the invite', async () => {
    // Regression test: an earlier version called admin.createUser({email_confirm:true})
    // BEFORE generateLink({type:'invite'}) — confirmed live against Supabase that this
    // combination fails with "A user with this email address has already been
    // registered", because a confirmed user is no longer "pending invite" from
    // Supabase's point of view. generateLink({type:'invite'}) must create the user
    // itself, in one step, via `options.data`.
    const res = await POST(makeRequest({ waitingListId: 'wl-1' }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.accountCreated).toBe(true)
    expect(createUser).not.toHaveBeenCalled()
    expect(generateLink).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'invite',
        email: 'amanda@example.com',
        options: expect.objectContaining({
          // Regression guard: must point straight at /update-password, not
          // /auth/callback — Supabase carries this link's session and type
          // in a URL hash fragment, which the server never sees, so
          // /auth/callback has no way to route an invite link correctly
          // unless the query string explicitly duplicates `type` (which
          // this flow doesn't do).
          redirectTo: expect.stringContaining('/update-password'),
          data: expect.objectContaining({ first_name: 'Amanda' })
        })
      })
    )
    expect(profileUpdateEq).toHaveBeenCalled() // bio/phone prefilled from waiting_list
    expect(sendWaitingListAccountInvite).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'amanda@example.com', inviteLink: expect.stringContaining('token=abc') })
    )
    expect(waitingListUpdateEq).toHaveBeenCalled() // status marked "invited"
  })

  it('uses a recovery link instead of creating a duplicate account when a profile already exists', async () => {
    // Regression guard: Supabase's "invite" link type errors for an email
    // that already has an account, so an existing profile must switch to
    // "recovery" rather than attempting createUser again.
    mockServiceSupabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'existing-user' }, error: null })
            })
          }),
          update: jest.fn().mockReturnValue({ eq: profileUpdateEq })
        }
      }
      return {}
    })

    const res = await POST(makeRequest({ waitingListId: 'wl-1' }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.accountCreated).toBe(false)
    expect(createUser).not.toHaveBeenCalled()
    expect(generateLink).toHaveBeenCalledWith(expect.objectContaining({ type: 'recovery' }))
  })

  it('returns 502 without marking as invited when the email fails to send', async () => {
    ;(sendWaitingListAccountInvite as jest.Mock).mockResolvedValue({ success: false, error: 'Brevo down' })

    const res = await POST(makeRequest({ waitingListId: 'wl-1' }))

    expect(res.status).toBe(502)
    expect(waitingListUpdateEq).not.toHaveBeenCalled()
  })
})
