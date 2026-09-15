/**
 * @jest-environment node
 */
import { POST } from './route'
import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createClient } from '@/lib/utils/supabase/server'
import { sendWaitingListCompleteProfileRequest } from '@/lib/email/brevo'

jest.mock('@/lib/auth/require-admin', () => ({ requireAdmin: jest.fn() }))
jest.mock('@/lib/utils/supabase/server', () => ({ createClient: jest.fn() }))
jest.mock('@/lib/email/brevo', () => ({
  sendWaitingListCompleteProfileRequest: jest.fn()
}))

const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>

function makeRequest(body: any) {
  return new NextRequest('http://localhost:3000/api/admin/waiting-list/request-info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

describe('POST /api/admin/waiting-list/request-info', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({ ok: true, admin: { userId: 'admin-1', role: 'admin' } })
    ;(sendWaitingListCompleteProfileRequest as jest.Mock).mockResolvedValue({ success: true })

    mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { name: 'Paulo Daniel', email: 'paulo@example.com' },
              error: null
            })
          })
        })
      })
    }
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  it('rejects non-admins', async () => {
    const { NextResponse } = await import('next/server')
    mockRequireAdmin.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    })

    const res = await POST(makeRequest({ waitingListId: 'wl-1' }))

    expect(res.status).toBe(403)
    expect(sendWaitingListCompleteProfileRequest).not.toHaveBeenCalled()
  })

  it('sends the complete-profile email for a valid entry', async () => {
    const res = await POST(makeRequest({ waitingListId: 'wl-1' }))

    expect(res.status).toBe(200)
    expect(sendWaitingListCompleteProfileRequest).toHaveBeenCalledWith({
      name: 'Paulo Daniel',
      email: 'paulo@example.com'
    })
  })

  it('returns 404 when the entry does not exist', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: new Error('not found') })
        })
      })
    })

    const res = await POST(makeRequest({ waitingListId: 'missing' }))
    expect(res.status).toBe(404)
  })
})
