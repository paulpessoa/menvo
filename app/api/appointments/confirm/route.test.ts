/**
 * @jest-environment node
 */
import { POST } from './route'
import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/utils/supabase/server'
import { sendAppointmentConfirmation } from '@/lib/email/brevo'
import { isGoogleCalendarConfigured } from '@/lib/services/mentorship/google-calendar.service'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}))

jest.mock('@/lib/utils/supabase/server', () => ({
  createClient: jest.fn()
}))

jest.mock('@/lib/email/brevo', () => ({
  sendAppointmentConfirmation: jest.fn().mockResolvedValue(undefined)
}))

jest.mock('@/lib/services/mentorship/google-calendar.service', () => ({
  createCalendarEvent: jest.fn(),
  isGoogleCalendarConfigured: jest.fn().mockReturnValue(false),
  getMissingEnvVars: jest.fn().mockReturnValue([])
}))

describe('POST /api/appointments/confirm', () => {
  let mockAdminSupabase: any
  let mockSessionSupabase: any

  function createMockRequest(body: Record<string, any>) {
    return new NextRequest('http://localhost:3000/api/appointments/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  }

  function mockAppointmentLookup(appointment: any) {
    mockAdminSupabase.from.mockImplementation((table: string) => {
      if (table === 'appointments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: appointment, error: null })
            })
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
          })
        }
      }
      return {}
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(isGoogleCalendarConfigured as jest.Mock).mockReturnValue(false)

    mockAdminSupabase = { from: jest.fn() }
    ;(createClient as jest.Mock).mockReturnValue(mockAdminSupabase)

    mockSessionSupabase = { auth: { getUser: jest.fn() } }
    ;(createServerClient as jest.Mock).mockResolvedValue(mockSessionSupabase)
  })

  it('confirms via token without requiring a session', async () => {
    mockAppointmentLookup({
      id: 'app-1',
      status: 'pending',
      mentor_id: 'mentor-1',
      duration_minutes: 45,
      scheduled_at: '2026-09-20T14:00:00Z',
      mentor: { id: 'mentor-1', full_name: 'Dr. Mentor', email: 'mentor@menvo.com.br' },
      mentee: { id: 'mentee-1', full_name: 'Aluno João', email: 'joao@example.com' }
    })

    const req = createMockRequest({ token: 'a-secret-token' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockSessionSupabase.auth.getUser).not.toHaveBeenCalled()
    expect(sendAppointmentConfirmation).toHaveBeenCalled()
  })

  it('rejects appointmentId-based confirmation with no session', async () => {
    mockAppointmentLookup({
      id: 'app-1',
      status: 'pending',
      mentor_id: 'mentor-1',
      duration_minutes: 45,
      scheduled_at: '2026-09-20T14:00:00Z',
      mentor: { id: 'mentor-1', full_name: 'Dr. Mentor', email: 'mentor@menvo.com.br' },
      mentee: { id: 'mentee-1', full_name: 'Aluno João', email: 'joao@example.com' }
    })
    mockSessionSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('no session')
    })

    const req = createMockRequest({ appointmentId: 'app-1' })
    const res = await POST(req)

    expect(res.status).toBe(403)
    expect(sendAppointmentConfirmation).not.toHaveBeenCalled()
  })

  it('rejects appointmentId-based confirmation when the caller is not the appointment mentor', async () => {
    // Regression test: this endpoint used to accept a bare appointmentId with
    // no ownership check at all, so any signed-in (or unauthenticated) caller
    // who knew a pending appointment's UUID could confirm someone else's
    // mentorship session, triggering a real Google Calendar invite and email.
    mockAppointmentLookup({
      id: 'app-1',
      status: 'pending',
      mentor_id: 'mentor-1',
      duration_minutes: 45,
      scheduled_at: '2026-09-20T14:00:00Z',
      mentor: { id: 'mentor-1', full_name: 'Dr. Mentor', email: 'mentor@menvo.com.br' },
      mentee: { id: 'mentee-1', full_name: 'Aluno João', email: 'joao@example.com' }
    })
    mockSessionSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'attacker-1' } },
      error: null
    })

    const req = createMockRequest({ appointmentId: 'app-1' })
    const res = await POST(req)

    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toBe('Não autorizado a confirmar este agendamento')
    expect(sendAppointmentConfirmation).not.toHaveBeenCalled()
  })

  it('allows appointmentId-based confirmation when the caller is the appointment mentor', async () => {
    mockAppointmentLookup({
      id: 'app-1',
      status: 'pending',
      mentor_id: 'mentor-1',
      duration_minutes: 45,
      scheduled_at: '2026-09-20T14:00:00Z',
      mentor: { id: 'mentor-1', full_name: 'Dr. Mentor', email: 'mentor@menvo.com.br' },
      mentee: { id: 'mentee-1', full_name: 'Aluno João', email: 'joao@example.com' }
    })
    mockSessionSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'mentor-1' } },
      error: null
    })

    const req = createMockRequest({ appointmentId: 'app-1', mentorNotes: 'Tudo certo' })
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(sendAppointmentConfirmation).toHaveBeenCalled()
  })
})
