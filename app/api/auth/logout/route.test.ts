/**
 * @jest-environment node
 */
import { POST } from './route'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/utils/supabase/server'

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

jest.mock('@/lib/utils/supabase/server', () => ({
  createClient: jest.fn(),
}))

describe('POST /api/auth/logout', () => {
  let mockCookieStore: any
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockCookieStore = {
      getAll: jest.fn().mockReturnValue([
        { name: 'sb-evxrzmzkghshjmmyegxu-auth-token', value: 'token1' },
        { name: 'sb-evxrzmzkghshjmmyegxu-auth-token.0', value: 'token2' },
        { name: 'other_unrelated_cookie', value: 'keep_me' },
      ]),
      delete: jest.fn(),
    }
    ;(cookies as jest.Mock).mockResolvedValue(mockCookieStore)

    mockSupabase = {
      auth: {
        signOut: jest.fn().mockResolvedValue({ error: null }),
      },
    }
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  it('should call signOut and delete all Supabase auth cookies', async () => {
    const response = await POST()
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)

    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    expect(mockCookieStore.delete).toHaveBeenCalledWith({
      name: 'sb-evxrzmzkghshjmmyegxu-auth-token',
      path: '/',
    })
    expect(mockCookieStore.delete).toHaveBeenCalledWith({
      name: 'sb-evxrzmzkghshjmmyegxu-auth-token.0',
      path: '/',
    })
    expect(mockCookieStore.delete).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: 'other_unrelated_cookie' })
    )
  })

  it('should still delete cookies and return 200 even if Supabase signOut throws', async () => {
    mockSupabase.auth.signOut.mockRejectedValue(new Error('Network error'))

    const response = await POST()
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(mockCookieStore.delete).toHaveBeenCalled()
  })
})
