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
}))

describe('POST /api/appointments/schedule', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    }
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  function createMockRequest(body: Record<string, any>) {
    return new NextRequest('http://localhost:3000/api/appointments/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('should return 401 when user is not authenticated', () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Unauthorized'),
    })

    const req = createMockRequest({ mentorId: 'mentor-123', scheduledAt: '2026-09-10T10:00:00Z' })
    return POST(req).then(async (response) => {
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.code).toBe('UNAUTHORIZED')
    })
  })

  it('should return 400 when required fields are missing', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'mentee-1' } },
      error: null,
    })

    const req = createMockRequest({ mentorId: '' })
    const response = await POST(req)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.code).toBe('VALIDATION_ERROR')
  })

  it('should return 400 FORBIDDEN when user attempts self-booking', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-same-id' } },
      error: null,
    })

    const req = createMockRequest({
      mentorId: 'user-same-id',
      scheduledAt: '2026-09-10T10:00:00Z',
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.code).toBe('FORBIDDEN')
    expect(data.error).toContain('Você não pode agendar uma mentoria consigo mesmo')
  })

  it('should return 404 when mentor profile does not exist', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'mentee-1' } },
      error: null,
    })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
        }
      }
      return {}
    })

    const req = createMockRequest({
      mentorId: 'non-existent-mentor',
      scheduledAt: '2026-09-10T10:00:00Z',
    })
    const response = await POST(req)
    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.code).toBe('NOT_FOUND')
  })

  it('should return 403 when mentor is not verified', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'mentee-1' } },
      error: null,
    })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'mentor-1', verified: false, full_name: 'Unverified Mentor' },
            error: null,
          }),
        }
      }
      return {}
    })

    const req = createMockRequest({
      mentorId: 'mentor-1',
      scheduledAt: '2026-09-10T10:00:00Z',
    })
    const response = await POST(req)
    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data.code).toBe('FORBIDDEN')
    expect(data.error).toContain('Mentor is not verified')
  })

  it('should return 409 CONFLICT when the time slot is already reserved', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'mentee-1' } },
      error: null,
    })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'mentor-1', verified: true, full_name: 'Verified Mentor', email: 'm@menvo.com' },
            error: null,
          }),
        }
      }
      if (table === 'appointments') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id: 'existing-conflict-appt-id' },
            error: null,
          }),
        }
      }
      return {}
    })

    const req = createMockRequest({
      mentorId: 'mentor-1',
      scheduledAt: '2026-09-10T10:00:00Z',
    })
    const response = await POST(req)
    expect(response.status).toBe(409)
    const data = await response.json()
    expect(data.code).toBe('CONFLICT')
    expect(data.error).toContain('Este horário acabou de ser reservado')
  })

  it('should successfully schedule appointment and trigger email dispatch', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'mentee-1', email: 'mentee@test.com' } },
      error: null,
    })

    const mockCreatedAppt = {
      id: 'new-appt-123',
      mentor_id: 'mentor-1',
      mentee_id: 'mentee-1',
      scheduled_at: '2026-09-10T10:00:00Z',
      status: 'pending',
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'mentor-1', verified: true, full_name: 'Verified Mentor', email: 'mentor@test.com' },
            error: null,
          }),
        }
      }
      if (table === 'appointments') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          insert: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockCreatedAppt, error: null }),
        }
      }
      return {}
    })

    const req = createMockRequest({
      mentor_id: 'mentor-1',
      scheduled_at: '2026-09-10T10:00:00Z',
      duration_minutes: 45,
      notes_mentee: 'Dúvidas de carreira',
    })
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.id).toBe('new-appt-123')
    expect(sendAppointmentRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        mentorEmail: 'mentor@test.com',
        mentorName: 'Verified Mentor',
        scheduledAt: '2026-09-10T10:00:00Z',
      })
    )
  })
})
