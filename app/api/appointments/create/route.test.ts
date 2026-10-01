/**
 * @jest-environment node
 */
import { POST } from './route'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/utils/supabase/server'
import { sendAppointmentRequest } from '@/lib/email/brevo'

jest.mock('@/lib/utils/supabase/server', () => ({
  createClient: jest.fn(),
}))

jest.mock('@/lib/email/brevo', () => ({
  sendAppointmentRequest: jest.fn().mockResolvedValue({ success: true }),
  sendAdminNewAppointmentNotification: jest.fn().mockResolvedValue({ success: true }),
}))

const MENTOR_ID = '9b2f7f2e-3c4d-4e5f-8a6b-1c2d3e4f5a6b'
const VALID_REASON = 'Quero orientação sobre transição de carreira para a área de dados'

describe('POST /api/appointments/create', () => {
  let mockSupabase: any
  let insertMock: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    delete process.env.BREVO_API_KEY

    insertMock = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockImplementation(async () => ({
          data: {
            id: 'appt-1',
            scheduled_at: '2026-10-07T16:00:00.000Z',
            notes_mentee: insertMock.mock.calls[0][0].notes_mentee,
            mentor: { full_name: 'Bianca Dias', email: 'mentora@example.com' },
            mentee: { full_name: 'Maria Silva', email: 'maria@example.com' },
          },
          error: null,
        })),
      }),
    })

    mockSupabase = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'mentee-1' } }, error: null }) },
      from: jest.fn().mockReturnValue({ insert: insertMock }),
    }
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  function createMockRequest(body: Record<string, any>) {
    return new NextRequest('http://localhost:3000/api/appointments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  const base = { mentor_id: MENTOR_ID, scheduled_at: '2026-10-07T16:00:00.000Z' }

  it.each([
    ['ausente', {}],
    ['vazio', { message: '' }],
    ['curto demais', { message: 'Quero ajuda' }],
    ['só espaços', { notes_mentee: ' '.repeat(40) }],
  ])('should return 400 without creating anything when the reason is %s', async (_label, extra) => {
    const response = await POST(createMockRequest({ ...base, ...extra }))

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('motivo')
    expect(insertMock).not.toHaveBeenCalled()
    expect(sendAppointmentRequest).not.toHaveBeenCalled()
  })

  it('should persist the reason sent as `message` (what BookingForm used to send) as notes_mentee', async () => {
    const response = await POST(createMockRequest({ ...base, message: VALID_REASON }))

    expect(response.status).toBe(201)
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ notes_mentee: VALID_REASON, mentee_id: 'mentee-1', status: 'pending' })
    )
  })

  it('should forward the reason to the mentor e-mail instead of "Nenhuma mensagem enviada."', async () => {
    await POST(createMockRequest({ ...base, notes_mentee: VALID_REASON }))

    expect(sendAppointmentRequest).toHaveBeenCalledWith(
      expect.objectContaining({ message: VALID_REASON, mentorEmail: 'mentora@example.com' })
    )
  })

  it('should return 401 when the user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('no session') })

    const response = await POST(createMockRequest({ ...base, notes_mentee: VALID_REASON }))

    expect(response.status).toBe(401)
    expect(insertMock).not.toHaveBeenCalled()
  })
})
