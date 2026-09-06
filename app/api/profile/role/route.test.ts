/**
 * @jest-environment node
 */
import { POST } from './route'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/utils/supabase/server'

jest.mock('@/lib/utils/supabase/server', () => ({
  createClient: jest.fn(),
}))

describe('POST /api/profile/role', () => {
  let mockSupabase: any

  const createMockRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/profile/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-123', email: 'test@menvo.com.br' } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        if (table === 'validation_requests') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          }
        }
        if (table === 'roles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 2, name: 'mentor' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'user_roles') {
          return {
            upsert: jest.fn().mockResolvedValue({ error: null }),
          }
        }
        return {}
      }),
    }

    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  it('should return 401 if user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Unauthorized'),
    })

    const request = createMockRequest({ role: 'mentee' })
    const response = await POST(request)

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Não autorizado')
  })

  it('should return 400 if role is invalid or missing', async () => {
    const request = createMockRequest({ role: 'invalid_role' })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Role inválida')
  })

  it('should successfully assign mentee role and update profile data', async () => {
    const request = createMockRequest({
      role: 'mentee',
      profileData: {
        city: 'Recife',
        state: 'PE',
        learning_goals: 'Aprender Next.js',
        mentorship_topics: ['Frontend', 'React'],
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.role).toBe('mentee')
    expect(data.status).toBe('approved')

    expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
    expect(mockSupabase.from).toHaveBeenCalledWith('user_roles')
  })

  it('should successfully assign mentor role and create validation request', async () => {
    const request = createMockRequest({
      role: 'mentor',
      profileData: {
        job_title: 'Senior Engineer',
        company: 'Tech Corp',
        linkedin_url: 'https://linkedin.com/in/mentor',
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.role).toBe('mentor')
    expect(data.status).toBe('pending')

    expect(mockSupabase.from).toHaveBeenCalledWith('validation_requests')
    expect(mockSupabase.from).toHaveBeenCalledWith('user_roles')
  })
})
