/**
 * @jest-environment node
 */
import { POST } from './route'
import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createClient } from '@/lib/utils/supabase/server'
import { sendWaitingListContactRequest } from '@/lib/email/brevo'

jest.mock('@/lib/auth/require-admin', () => ({ requireAdmin: jest.fn() }))
jest.mock('@/lib/utils/supabase/server', () => ({ createClient: jest.fn() }))
jest.mock('@/lib/email/brevo', () => ({
  sendWaitingListContactRequest: jest.fn()
}))

const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>

function makeRequest(body: any) {
  return new NextRequest('http://localhost:3000/api/admin/waiting-list/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

describe('POST /api/admin/waiting-list/contact', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({ ok: true, admin: { userId: 'admin-1', role: 'admin' } })
    ;(sendWaitingListContactRequest as jest.Mock).mockResolvedValue({ success: true })

    mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { name: 'Amanda Oliveira', email: 'amanda@example.com' },
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
    expect(sendWaitingListContactRequest).not.toHaveBeenCalled()
  })

  it('returns 400 when waitingListId is missing', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
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

  it('sends the contact-request email for a valid entry', async () => {
    const res = await POST(makeRequest({ waitingListId: 'wl-1' }))

    expect(res.status).toBe(200)
    expect(sendWaitingListContactRequest).toHaveBeenCalledWith({
      name: 'Amanda Oliveira',
      email: 'amanda@example.com'
    })
  })

  it('returns 502 when the email fails to send', async () => {
    ;(sendWaitingListContactRequest as jest.Mock).mockResolvedValue({ success: false, error: 'Brevo down' })

    const res = await POST(makeRequest({ waitingListId: 'wl-1' }))
    expect(res.status).toBe(502)
  })
})
