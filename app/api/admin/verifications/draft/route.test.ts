/**
 * @jest-environment node
 */
import { POST } from './route'
import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createClient } from '@/lib/utils/supabase/server'
import { consumeAiQuota } from '@/lib/ai/quota'
import { draftMentorReview, loadMentorApplication } from '@/lib/ai-menvo/mentor-review/draft'

jest.mock('@/lib/auth/require-admin', () => ({ requireAdmin: jest.fn() }))
jest.mock('@/lib/utils/supabase/server', () => ({ createClient: jest.fn() }))
jest.mock('@/lib/ai/quota', () => ({ consumeAiQuota: jest.fn() }))
jest.mock('@/lib/ai/metering', () => ({ recordAiCalls: jest.fn() }))
jest.mock('@/lib/ai/models', () => ({
  AiModelUnavailableError: class AiModelUnavailableError extends Error {}
}))
jest.mock('@/lib/ai-menvo/mentor-review/draft', () => {
  const { z } = jest.requireActual('zod')
  return {
    mentorReviewKindSchema: z.enum(['approve', 'reject', 'announce']),
    loadMentorApplication: jest.fn(),
    draftMentorReview: jest.fn()
  }
})
jest.mock('next/server', () => ({ ...jest.requireActual('next/server'), after: jest.fn() }))

const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>
const USER_ID = '4f1c2b8e-7d3a-4e5f-9a1b-2c3d4e5f6a7b'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/admin/verifications/draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

const application = {
  id: USER_ID,
  fullName: 'Bianca Santos',
  jobTitle: 'Analista de Dados',
  company: null,
  bio: 'Trabalho com dados há 5 anos.',
  expertiseAreas: ['Dados'],
  mentorshipTopics: [],
  mentorshipApproach: null,
  whatToExpect: null,
  experienceYears: 5,
  hasLinkedin: true,
  hasCv: false,
  profileUrl: `https://www.menvo.com.br/mentors/${USER_ID}`
}

describe('POST /api/admin/verifications/draft', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({ ok: true, admin: { userId: 'admin-1', role: 'admin' } })
    ;(createClient as jest.Mock).mockResolvedValue({})
    ;(consumeAiQuota as jest.Mock).mockResolvedValue({ allowed: true, used: 1, limit: null, remaining: null, resetsAt: '2026-10-01T03:00:00Z', reason: 'ok' })
    ;(loadMentorApplication as jest.Mock).mockResolvedValue(application)
  })

  it('rejects non-admins before spending any AI credit', async () => {
    const { NextResponse } = await import('next/server')
    mockRequireAdmin.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    })

    const res = await POST(makeRequest({ userId: USER_ID, kind: 'approve' }))

    expect(res.status).toBe(403)
    expect(consumeAiQuota).not.toHaveBeenCalled()
    expect(draftMentorReview).not.toHaveBeenCalled()
  })

  it('returns 400 for an unknown kind', async () => {
    const res = await POST(makeRequest({ userId: USER_ID, kind: 'delete_user' }))

    expect(res.status).toBe(400)
    expect(draftMentorReview).not.toHaveBeenCalled()
  })

  it('returns 404 when the profile does not exist', async () => {
    ;(loadMentorApplication as jest.Mock).mockResolvedValue(null)

    const res = await POST(makeRequest({ userId: USER_ID, kind: 'approve' }))

    expect(res.status).toBe(404)
    expect(consumeAiQuota).not.toHaveBeenCalled()
  })

  it('returns 429 when the AI quota is exhausted', async () => {
    ;(consumeAiQuota as jest.Mock).mockResolvedValue({ allowed: false, used: 0, limit: 0, remaining: 0, resetsAt: '2026-10-01T03:00:00Z', reason: 'budget' })

    const res = await POST(makeRequest({ userId: USER_ID, kind: 'approve' }))

    expect(res.status).toBe(429)
    expect(draftMentorReview).not.toHaveBeenCalled()
  })

  it('returns the draft with the admin instructions passed through', async () => {
    const draft = {
      recommendation: 'request_changes',
      summary: 'Perfil com boa experiência, mas sem abordagem de mentoria.',
      strengths: ['5 anos em dados'],
      gaps: ['Abordagem de mentoria não preenchida'],
      message: 'Oi, Bianca! ...'
    }
    ;(draftMentorReview as jest.Mock).mockResolvedValue(draft)

    const res = await POST(makeRequest({ userId: USER_ID, kind: 'reject', instructions: 'mais curto' }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual({ kind: 'reject', draft })
    expect(consumeAiQuota).toHaveBeenCalledWith({}, 'admin_mentor_review')
    expect(draftMentorReview).toHaveBeenCalledWith(
      {},
      application,
      'reject',
      expect.objectContaining({ instructions: 'mais curto' })
    )
  })
})
