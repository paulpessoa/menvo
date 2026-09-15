/**
 * @jest-environment node
 */
import { GET } from './route'
import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createClient } from '@/lib/utils/supabase/server'

jest.mock('@/lib/auth/require-admin', () => ({
  requireAdmin: jest.fn()
}))

jest.mock('@/lib/utils/supabase/server', () => ({
  createClient: jest.fn()
}))

const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>

describe('GET /api/admin/audit-logs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rejects a caller who is authenticated but not an admin', async () => {
    // Regression test: this endpoint used to only call auth.getUser() and
    // never checked the caller's role, so any signed-in mentor or mentee
    // could read the full admin audit trail (admin emails, full names, and
    // every action taken against every target user).
    const { NextResponse } = await import('next/server')
    mockRequireAdmin.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    })

    const req = new NextRequest('http://localhost:3000/api/admin/audit-logs')
    const res = await GET(req)

    expect(res.status).toBe(403)
    expect(createClient).not.toHaveBeenCalled()
  })

  it('returns logs for an authorized admin', async () => {
    mockRequireAdmin.mockResolvedValue({
      ok: true,
      admin: { userId: 'admin-1', role: 'admin' }
    })

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              returns: jest.fn().mockResolvedValue({
                data: [{ id: 'log-1', action_type: 'user_deleted' }],
                error: null
              })
            })
          })
        })
      })
    }
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

    const req = new NextRequest('http://localhost:3000/api/admin/audit-logs')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.data).toHaveLength(1)
  })
})
