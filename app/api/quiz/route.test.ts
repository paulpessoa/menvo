/**
 * @jest-environment node
 */
import { POST } from './route'
import { createClient } from '@/lib/utils/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

jest.mock('@/lib/utils/supabase/server', () => ({
  createClient: jest.fn()
}))

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn()
}))

// `after()` only works inside a real request scope; run its callback inline.
jest.mock('next/server', () => ({
  ...jest.requireActual('next/server'),
  after: jest.fn((cb: () => unknown) => {
    void cb()
  })
}))

const validPayload = {
  name: 'Ana Silva',
  email: 'Ana@Example.com',
  linkedin_url: null,
  career_moment: 'estudante-universitario',
  mentorship_experience: 'nao-sei',
  development_areas: ['Desenvolvimento técnico'],
  current_challenge: 'Preciso de ajuda para conseguir meu primeiro estágio.',
  future_vision: 'Quero ser desenvolvedora front-end em uma boa empresa.',
  share_knowledge: 'sim-talvez',
  personal_life_help: 'Gostaria de equilibrar melhor estudo e trabalho.'
}

function makeSupabaseMock(insertError: unknown = null, userId: string | null = null) {
  const insert = jest.fn().mockResolvedValue({ error: insertError })
  return {
    from: jest.fn().mockReturnValue({ insert }),
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: userId ? { id: userId } : null } }) }
  }
}

describe('POST /api/quiz', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(checkRateLimit as jest.Mock).mockReturnValue({ allowed: true })
    global.fetch = jest.fn().mockResolvedValue({ ok: true })
  })

  it('returns 429 when rate limited', async () => {
    ;(checkRateLimit as jest.Mock).mockReturnValue({ allowed: false })

    const req = new Request('http://localhost:3000/api/quiz', {
      method: 'POST',
      body: JSON.stringify(validPayload)
    })

    const res = await POST(req as any)
    expect(res.status).toBe(429)
  })

  it('returns 400 for an invalid payload', async () => {
    const req = new Request('http://localhost:3000/api/quiz', {
      method: 'POST',
      body: JSON.stringify({ ...validPayload, email: 'not-an-email' })
    })

    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('rejects a client-supplied ai_analysis/score (not part of the schema)', async () => {
    const req = new Request('http://localhost:3000/api/quiz', {
      method: 'POST',
      body: JSON.stringify({ ...validPayload, score: 100, ai_analysis: { titulo_personalizado: 'x' } })
    })

    const supabase = makeSupabaseMock()
    ;(createClient as jest.Mock).mockResolvedValue(supabase)

    const res = await POST(req as any)
    expect(res.status).toBe(200)

    const insertCall = supabase.from.mock.calls[0]
    expect(insertCall[0]).toBe('quiz_responses')
    const insertedRow = (supabase.from('quiz_responses').insert as jest.Mock).mock.calls[0][0]
    expect(insertedRow).not.toHaveProperty('score')
    expect(insertedRow).not.toHaveProperty('ai_analysis')
  })

  it('lower-cases the e-mail and returns the generated id', async () => {
    const req = new Request('http://localhost:3000/api/quiz', {
      method: 'POST',
      body: JSON.stringify(validPayload)
    })

    const supabase = makeSupabaseMock()
    ;(createClient as jest.Mock).mockResolvedValue(supabase)

    const res = await POST(req as any)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.id).toEqual(expect.any(String))

    const insertedRow = (supabase.from('quiz_responses').insert as jest.Mock).mock.calls[0][0]
    expect(insertedRow.email).toBe('ana@example.com')
    expect(insertedRow.id).toBe(body.id)
  })

  it('sets user_id from the session for a logged-in caller (regression: WITH CHECK on the authenticated insert policy needs it)', async () => {
    const req = new Request('http://localhost:3000/api/quiz', {
      method: 'POST',
      body: JSON.stringify(validPayload)
    })

    const supabase = makeSupabaseMock(null, 'user-123')
    ;(createClient as jest.Mock).mockResolvedValue(supabase)

    const res = await POST(req as any)
    expect(res.status).toBe(200)

    const insertedRow = (supabase.from('quiz_responses').insert as jest.Mock).mock.calls[0][0]
    expect(insertedRow.user_id).toBe('user-123')
  })

  it('leaves user_id null for an anonymous caller', async () => {
    const req = new Request('http://localhost:3000/api/quiz', {
      method: 'POST',
      body: JSON.stringify(validPayload)
    })

    const supabase = makeSupabaseMock()
    ;(createClient as jest.Mock).mockResolvedValue(supabase)

    const res = await POST(req as any)
    expect(res.status).toBe(200)

    const insertedRow = (supabase.from('quiz_responses').insert as jest.Mock).mock.calls[0][0]
    expect(insertedRow.user_id).toBeNull()
  })

  it('does not wait for the AI analysis before responding (regression: 504 FUNCTION_INVOCATION_TIMEOUT)', async () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})) // never resolves
    const supabase = makeSupabaseMock()
    ;(createClient as jest.Mock).mockResolvedValue(supabase)

    const req = new Request('http://localhost:3000/api/quiz', {
      method: 'POST',
      body: JSON.stringify(validPayload)
    })

    const res = await POST(req as any)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(global.fetch).toHaveBeenCalledWith(
      new URL(`http://localhost:3000/api/quiz/${body.id}/analyze`),
      { method: 'POST' }
    )
  })

  it('returns 500 when the insert fails', async () => {
    const req = new Request('http://localhost:3000/api/quiz', {
      method: 'POST',
      body: JSON.stringify(validPayload)
    })

    const supabase = makeSupabaseMock({ message: 'boom' })
    ;(createClient as jest.Mock).mockResolvedValue(supabase)

    const res = await POST(req as any)
    expect(res.status).toBe(500)
  })
})
