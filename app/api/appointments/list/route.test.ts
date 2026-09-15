/**
 * @jest-environment node
 */
import { GET } from './route'
import { NextRequest } from 'next/server'
import { createClient as createServerClient } from '@/lib/utils/supabase/server'
import { createServiceRoleClient } from '@/lib/utils/supabase/service-role'

jest.mock('@/lib/utils/supabase/server', () => ({
  createClient: jest.fn()
}))

jest.mock('@/lib/utils/supabase/service-role', () => ({
  createServiceRoleClient: jest.fn()
}))

function makeRequest(qs: string) {
  return new NextRequest(`http://localhost:3000/api/appointments/list${qs}`)
}

describe('GET /api/appointments/list', () => {
  let mockServerSupabase: any
  let mockServiceSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockServerSupabase = {
      auth: { getUser: jest.fn() }
    }
    ;(createServerClient as jest.Mock).mockResolvedValue(mockServerSupabase)

    const queryBuilder: any = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      then: (resolve: any) =>
        resolve({
          data: [
            {
              id: 'app-1',
              mentor: { id: 'mentor-1', full_name: 'Mentor Teste' },
              mentee: { id: 'mentee-1', full_name: 'Mentee Teste' }
            }
          ],
          error: null
        })
    }
    mockServiceSupabase = { from: jest.fn().mockReturnValue(queryBuilder) }
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockServiceSupabase)
  })

  it('returns 401 when there is no session', async () => {
    mockServerSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('no session') })

    const res = await GET(makeRequest('?role=mentor'))

    expect(res.status).toBe(401)
    expect(createServiceRoleClient).not.toHaveBeenCalled()
  })

  it('returns the other party fully populated instead of null', async () => {
    // Regression test: this route used to query `appointments` with the
    // caller's own cookie-authenticated (RLS-bound) client. The embedded
    // profiles!mentor_id / profiles!mentee_id joins are subject to RLS on
    // `profiles`, so when the OTHER party's profile isn't flagged public,
    // PostgREST silently resolves that embed to null instead of erroring.
    // components/appointments/chat-button.tsx then crashes the whole page
    // reading `otherPerson.full_name` from null. A booked appointment
    // between two specific people already authorizes each side to see the
    // other's basic name/avatar, so this must use the service-role client.
    mockServerSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'mentor-1' } },
      error: null
    })

    const res = await GET(makeRequest('?role=mentor&status=pending'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(createServiceRoleClient).toHaveBeenCalled()
    expect(data.appointments[0].mentee).not.toBeNull()
    expect(data.appointments[0].mentee.full_name).toBe('Mentee Teste')
  })
})
