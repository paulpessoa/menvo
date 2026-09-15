/**
 * @jest-environment node
 */
import { POST } from './route'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/utils/supabase/server'
import { sendAdminNewMentorNotification } from '@/lib/email/brevo'

jest.mock('@/lib/utils/supabase/server', () => ({
  createClient: jest.fn()
}))

jest.mock('@/lib/email/brevo', () => ({
  sendAdminNewMentorNotification: jest.fn().mockResolvedValue(undefined)
}))

describe('POST /api/profile/request-mentor', () => {
  let mockSupabase: any

  function createMockRequest(body: any) {
    return new NextRequest('http://localhost:3000/api/profile/request-mentor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-1', email: 'mentor@menvo.com.br', user_metadata: { first_name: 'Ana' } } },
          error: null
        })
      },
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'user-1', is_pending_mentor: true },
                error: null
              })
            })
          })
        })
      })
    }
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  it('returns 401 when there is no session', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('no session') })

    const res = await POST(createMockRequest({ mentorship_approach: 'Conversas práticas' }))

    expect(res.status).toBe(401)
  })

  it('rejects the request when mentorship_approach is missing', async () => {
    // Regression test: the mentorship-approach fields used to only appear
    // AFTER the request was already submitted (gated on isPendingMentor),
    // so the admin notification and the profile itself never carried this
    // context. The dialog now collects it up front, and the API enforces
    // that it's actually present.
    const res = await POST(createMockRequest({}))

    expect(res.status).toBe(400)
    expect(sendAdminNewMentorNotification).not.toHaveBeenCalled()
  })

  it('persists the approach/expectations and forwards them to the admin notification', async () => {
    const res = await POST(
      createMockRequest({
        mentorship_approach: 'Sessões práticas de revisão de código',
        what_to_expect: 'Traga um projeto real para revisarmos juntos'
      })
    )

    expect(res.status).toBe(200)

    const updateCall = mockSupabase.from.mock.results[0].value.update
    expect(updateCall).toHaveBeenCalledWith(
      expect.objectContaining({
        is_pending_mentor: true,
        verification_status: 'pending',
        mentorship_approach: 'Sessões práticas de revisão de código',
        what_to_expect: 'Traga um projeto real para revisarmos juntos'
      })
    )

    expect(sendAdminNewMentorNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        mentorshipApproach: 'Sessões práticas de revisão de código',
        whatToExpect: 'Traga um projeto real para revisarmos juntos'
      })
    )
  })
})
