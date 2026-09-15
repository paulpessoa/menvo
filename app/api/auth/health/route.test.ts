/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server'
import { GET } from './route'
import { handleOAuthHealthCheck } from '@/lib/auth/oauth-middleware'

jest.mock('@/lib/auth/oauth-middleware', () => ({
  handleOAuthHealthCheck: jest.fn()
}))

const mockHandle = handleOAuthHealthCheck as jest.MockedFunction<typeof handleOAuthHealthCheck>

describe('GET /api/auth/health', () => {
  const originalEnv = process.env.NODE_ENV

  afterEach(() => {
    ;(process.env as any).NODE_ENV = originalEnv
  })

  it('returns 404 in production, without exposing OAuth provider config', async () => {
    // Regression test: this endpoint had no gate at all, so anyone could
    // curl it in production and learn which OAuth providers are
    // configured/misconfigured — free reconnaissance about the app's infra.
    // The only consumer (components/auth/oauth-validator.tsx) already
    // restricts itself to development; the route now mirrors that.
    ;(process.env as any).NODE_ENV = 'production'

    const res = await GET(new NextRequest('http://localhost:3000/api/auth/health'))

    expect(res.status).toBe(404)
    expect(mockHandle).not.toHaveBeenCalled()
  })

  it('runs the health check outside production', async () => {
    ;(process.env as any).NODE_ENV = 'development'
    mockHandle.mockReturnValue(NextResponse.json({ status: 'healthy' }))

    const res = await GET(new NextRequest('http://localhost:3000/api/auth/health'))

    expect(res.status).toBe(200)
    expect(mockHandle).toHaveBeenCalled()
  })
})
