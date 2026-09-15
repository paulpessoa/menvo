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
              in: jest.fn().mockResolvedValue({
                data: [
                  { id: 1, name: 'mentee' },
                  { id: 2, name: 'mentor' },
                ],
                error: null,
              }),
            }),
          }
        }
        if (table === 'user_roles') {
          const deleteEq = jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({ error: null }),
          })
          return {
            delete: jest.fn().mockReturnValue({ eq: deleteEq }),
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
            insert: jest.fn().mockResolvedValue({ error: null }),
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

  it('never writes a "user_role" column to profiles', async () => {
    // Regression test: profiles has no `user_role` column (confirmed
    // against the live schema — PostgREST returns PGRST204 "Could not find
    // the 'user_role' column"). Including it in the update payload makes
    // PostgREST reject the WHOLE update, which made this endpoint fail
    // with 500 for every single user completing onboarding. The real role
    // lives only in user_roles, written separately below.
    const profilesUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    })
    mockSupabase.from = jest.fn((table: string) => {
      if (table === 'profiles') return { update: profilesUpdate }
      if (table === 'roles') {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({ data: [{ id: 1, name: 'mentee' }], error: null }),
          }),
        }
      }
      if (table === 'user_roles') {
        return {
          delete: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ in: jest.fn().mockResolvedValue({ error: null }) }) }),
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
          insert: jest.fn().mockResolvedValue({ error: null }),
        }
      }
      return {}
    })

    const request = createMockRequest({ role: 'mentee' })
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(profilesUpdate).toHaveBeenCalledTimes(1)
    const payload = profilesUpdate.mock.calls[0][0]
    expect(payload).not.toHaveProperty('user_role')
  })

  it('removes the previous mentor/mentee role before assigning the new one', async () => {
    // Regression test: the route used to blindly upsert the new role without
    // clearing the old one, so a user switching mentee <-> mentor ended up
    // with both rows in user_roles. That breaks every admin endpoint that
    // reads this table with .single()/.maybeSingle() for that user.
    const deleteEq = jest.fn().mockReturnValue({
      in: jest.fn().mockResolvedValue({ error: null }),
    })
    const userRolesDelete = jest.fn().mockReturnValue({ eq: deleteEq })
    const userRolesInsert = jest.fn().mockResolvedValue({ error: null })
    const userRolesSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    })

    mockSupabase.from = jest.fn((table: string) => {
      if (table === 'profiles') {
        return { update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }) }
      }
      if (table === 'roles') {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({
              data: [
                { id: 1, name: 'mentee' },
                { id: 2, name: 'mentor' },
              ],
              error: null,
            }),
          }),
        }
      }
      if (table === 'user_roles') {
        return { delete: userRolesDelete, select: userRolesSelect, insert: userRolesInsert }
      }
      return {}
    })

    const request = createMockRequest({ role: 'mentee' })
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(userRolesDelete).toHaveBeenCalled()
    expect(deleteEq).toHaveBeenCalledWith('user_id', 'test-user-123')
    expect(userRolesInsert).toHaveBeenCalledWith({ user_id: 'test-user-123', role_id: 1 })
  })

  it('does not insert a duplicate row when the role assignment already exists', async () => {
    // Regression test: user_roles has no unique constraint on
    // (user_id, role_id) (its primary key is a synthetic `id`), so
    // `.upsert(..., { onConflict: "user_id,role_id" })` fails outright with
    // Postgres error 42P10 ("no unique or exclusion constraint matching the
    // ON CONFLICT specification") — confirmed directly against the live
    // database. The fix checks for an existing row first and only inserts
    // when one isn't found, so this must not insert when it already exists.
    const userRolesInsert = jest.fn().mockResolvedValue({ error: null })
    mockSupabase.from = jest.fn((table: string) => {
      if (table === 'profiles') {
        return { update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }) }
      }
      if (table === 'roles') {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({ data: [{ id: 1, name: 'mentee' }], error: null }),
          }),
        }
      }
      if (table === 'user_roles') {
        return {
          delete: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ in: jest.fn().mockResolvedValue({ error: null }) }) }),
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'existing-row' }, error: null }),
              }),
            }),
          }),
          insert: userRolesInsert,
        }
      }
      return {}
    })

    const request = createMockRequest({ role: 'mentee' })
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(userRolesInsert).not.toHaveBeenCalled()
  })
})
