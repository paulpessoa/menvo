/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue(undefined),
    set: jest.fn()
  })
}))

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn()
}))

jest.mock('@/lib/auth/oauth-identity', () => ({
  syncProfileIdentity: jest.fn()
}))

jest.mock('@/lib/utils/supabase/service-role', () => ({
  createServiceRoleClient: jest.fn(() => ({ admin: true }))
}))

import { createServerClient } from '@supabase/ssr'
import { syncProfileIdentity } from '@/lib/auth/oauth-identity'
import { createServiceRoleClient } from '@/lib/utils/supabase/service-role'
import { GET } from './route'

describe('GET /auth/callback', () => {
  it('redirects a "recovery" link to /update-password', async () => {
    const req = new NextRequest('http://localhost:3000/auth/callback?type=recovery')
    const res = await GET(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/update-password')
  })

  it('redirects an "invite" link to /update-password', async () => {
    // Regression test: this branch didn't exist before - an invite link
    // (used to onboard someone whose account was created by an admin, e.g.
    // from the waiting list) fell through to the generic `next` fallback,
    // landing the person on /dashboard already authenticated (the session
    // is established client-side via the URL hash fragment regardless of
    // this route's redirect target) but having never seen a screen to set
    // a password they'd actually know.
    const req = new NextRequest('http://localhost:3000/auth/callback?type=invite')
    const res = await GET(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/update-password')
  })

  describe('completing the profile name after a code login (Google / LinkedIn)', () => {
    const user = {
      id: 'user-1',
      user_metadata: { name: 'Polianna Chiappetta', given_name: 'Polianna', family_name: 'Chiappetta' }
    }

    function mockSession({ exchangeError = null as any } = {}) {
      const profileQuery: any = {
        select: () => profileQuery,
        eq: () => profileQuery,
        maybeSingle: async () => ({ data: { user_roles: [{ roles: { name: 'mentee' } }] } })
      }
      ;(createServerClient as jest.Mock).mockReturnValue({
        auth: {
          exchangeCodeForSession: jest.fn().mockResolvedValue({ error: exchangeError }),
          getUser: jest.fn().mockResolvedValue({ data: { user } })
        },
        from: jest.fn(() => profileQuery)
      })
    }

    const callback = () => GET(new NextRequest('http://localhost:3000/auth/callback?code=abc'))

    beforeEach(() => {
      jest.clearAllMocks()
      ;(syncProfileIdentity as jest.Mock).mockResolvedValue({ updated: true })
      ;(createServiceRoleClient as jest.Mock).mockReturnValue({ admin: true })
      jest.spyOn(console, 'error').mockImplementation(() => {})
    })
    afterEach(() => jest.restoreAllMocks())

    it('syncs the name of the signed-in user, then redirects by role', async () => {
      mockSession()
      const res = await callback()

      expect(syncProfileIdentity).toHaveBeenCalledTimes(1)
      expect(syncProfileIdentity).toHaveBeenCalledWith({ admin: true }, user)
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/dashboard/mentee')
    })

    it('still logs the person in when the sync throws', async () => {
      mockSession()
      ;(syncProfileIdentity as jest.Mock).mockRejectedValue(new Error('db down'))
      const res = await callback()

      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/dashboard/mentee')
    })

    it('still logs the person in when the service role is not configured', async () => {
      mockSession()
      ;(createServiceRoleClient as jest.Mock).mockImplementation(() => {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined')
      })
      const res = await callback()

      expect(syncProfileIdentity).not.toHaveBeenCalled()
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/dashboard/mentee')
    })

    it('does not sync anything when the code exchange fails', async () => {
      mockSession({ exchangeError: { message: 'invalid grant' } })
      const res = await callback()

      expect(syncProfileIdentity).not.toHaveBeenCalled()
      expect(res.headers.get('location')).toContain('/login?error=')
    })
  })
})
