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

import { GET } from './route'

describe('GET /auth/callback', () => {
  it('redirects a "recovery" link to /update-password', async () => {
    const req = new NextRequest('http://localhost:3000/auth/callback?type=recovery')
    const res = await GET(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/update-password')
  })

  it('redirects an "invite" link to /update-password', async () => {
    // Regression test: this branch didn't exist before — an invite link
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
})
