/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server'

const mockGetUser = jest.fn()
const mockReturns = jest.fn()

jest.mock('next-intl/middleware', () => {
  return jest.fn(() => (_request: NextRequest) => NextResponse.next())
})

jest.mock('./i18n/routing', () => ({
  routing: {
    locales: ['pt-BR', 'en', 'es'],
    defaultLocale: 'pt-BR'
  }
}))

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          returns: mockReturns
        }))
      }))
    }))
  }))
}))

import { middleware } from './middleware'

function makeRequest(path: string) {
  return new NextRequest(new URL(`http://localhost:3000${path}`))
}

describe('middleware role protection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirects unauthenticated users away from admin routes to login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

    const res = await middleware(makeRequest('/pt-BR/dashboard/admin'))

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/pt-BR/login')
  })

  it('redirects an authenticated non-admin away from admin routes to /unauthorized', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mockReturns.mockResolvedValue({
      data: [{ roles: { name: 'mentee' } }]
    })

    const res = await middleware(makeRequest('/pt-BR/dashboard/admin'))

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/pt-BR/unauthorized')
  })

  it('allows an authenticated admin through to admin routes', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null })
    mockReturns.mockResolvedValue({
      data: [{ roles: { name: 'admin' } }]
    })

    const res = await middleware(makeRequest('/pt-BR/dashboard/admin'))

    expect(res.status).not.toBe(307)
  })

  it('redirects an authenticated user with no roles to onboarding from a protected route', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-2' } }, error: null })
    mockReturns.mockResolvedValue({ data: [] })

    const res = await middleware(makeRequest('/pt-BR/messages'))

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/pt-BR/onboarding')
  })

  it('does not redirect a user with a role away from a protected route', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-3' } }, error: null })
    mockReturns.mockResolvedValue({
      data: [{ roles: { name: 'mentee' } }]
    })

    const res = await middleware(makeRequest('/pt-BR/messages'))

    expect(res.status).not.toBe(307)
  })
})

describe('middleware 301 SEO redirects', () => {
  it('redirects /register and /auth/register to /signup with 301', async () => {
    const res1 = await middleware(makeRequest('/register'))
    expect(res1.status).toBe(301)
    expect(res1.headers.get('location')).toContain('/signup')

    const res2 = await middleware(makeRequest('/auth/register'))
    expect(res2.status).toBe(301)
    expect(res2.headers.get('location')).toContain('/signup')
  })

  it('redirects legacy /mentors/id and /organizations to /mentors with 301', async () => {
    const res1 = await middleware(makeRequest('/mentors/id'))
    expect(res1.status).toBe(301)
    expect(res1.headers.get('location')).toContain('/mentors')

    const res2 = await middleware(makeRequest('/organizations'))
    expect(res2.status).toBe(301)
    expect(res2.headers.get('location')).toContain('/mentors')
  })

  it('redirects obsolete test locales like /sv/how-it-works to clean path with 301', async () => {
    const res = await middleware(makeRequest('/sv/how-it-works'))
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toContain('/how-it-works')
  })

  it('redirects broken path /$ to / with 301', async () => {
    const res = await middleware(makeRequest('/$'))
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe('http://localhost:3000/')
  })
})
