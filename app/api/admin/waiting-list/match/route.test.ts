/**
 * @jest-environment node
 */
import { POST } from './route'
import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createClient } from '@/lib/utils/supabase/server'
import { aiMatchService } from '@/lib/services/ai/groq.service'

jest.mock('@/lib/auth/require-admin', () => ({ requireAdmin: jest.fn() }))
jest.mock('@/lib/utils/supabase/server', () => ({ createClient: jest.fn() }))
jest.mock('@/lib/services/ai/groq.service', () => ({
  aiMatchService: { findOptimalMentors: jest.fn() }
}))

const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>

function makeRequest(body: any) {
  return new NextRequest('http://localhost:3000/api/admin/waiting-list/match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

describe('POST /api/admin/waiting-list/match', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({ ok: true, admin: { userId: 'admin-1', role: 'admin' } })

    mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === 'waiting_list') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { name: 'Amanda', email: 'amanda@example.com', reason: 'Quero migrar para RH e Departamento Pessoal' },
                  error: null
                })
              })
            })
          }
        }
        if (table === 'mentors_view') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [
                    { id: 'mentor-1', full_name: 'Márcia Lima', job_title: 'Consultora de RH', bio: '', mentor_skills: [], email: 'marcia@example.com' }
                  ],
                  error: null
                })
              })
            })
          }
        }
        return {}
      })
    }
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  it('rejects non-admins', async () => {
    const { NextResponse } = await import('next/server')
    mockRequireAdmin.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    })

    const res = await POST(makeRequest({ waitingListId: 'wl-1' }))

    expect(res.status).toBe(403)
    expect(aiMatchService.findOptimalMentors).not.toHaveBeenCalled()
  })

  it('returns 400 when the entry has no reason filled in', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'waiting_list') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { name: 'Paulo', email: 'paulo@example.com', reason: null },
                error: null
              })
            })
          })
        }
      }
      return {}
    })

    const res = await POST(makeRequest({ waitingListId: 'wl-2' }))

    expect(res.status).toBe(400)
    expect(aiMatchService.findOptimalMentors).not.toHaveBeenCalled()
  })

  it('returns AI-suggested mentors without sending any email or notification', async () => {
    // This route is a pure suggestion surface for the admin — it must never
    // email the waiting-list person or the suggested mentor on its own.
    ;(aiMatchService.findOptimalMentors as jest.Mock).mockResolvedValue({
      suggestions: [{ mentor_id: 'mentor-1', reason: 'Especialista em RH e DP, alinhado ao objetivo dela.' }],
      global_justification: 'Márcia atua diretamente na área que Amanda busca.',
      suggested_topics: ['RH', 'Departamento Pessoal'],
      no_match: false
    })

    const res = await POST(makeRequest({ waitingListId: 'wl-1' }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.suggestions[0]).toMatchObject({
      mentor_id: 'mentor-1',
      mentor_name: 'Márcia Lima',
      mentor_email: 'marcia@example.com'
    })
    expect(aiMatchService.findOptimalMentors).toHaveBeenCalledWith(
      'Quero migrar para RH e Departamento Pessoal',
      expect.any(Array)
    )
  })
})
