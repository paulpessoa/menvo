/**
 * @jest-environment node
 */
import { GET } from './route'
import { NextRequest } from 'next/server'
import { createClient as createServerClient } from '@/lib/utils/supabase/server'
import { buildAppointmentsService } from '@/lib/services/appointments/appointments.composition'

jest.mock('@/lib/utils/supabase/server', () => ({ createClient: jest.fn() }))
jest.mock('@/lib/services/appointments/appointments.composition', () => ({ buildAppointmentsService: jest.fn() }))

function makeRequest(qs: string) {
  return new NextRequest(`http://localhost:3000/api/appointments/list${qs}`)
}

// O filtro por participante e o embed da outra parte são do repository
// (appointments.repository.test.ts). A regressão do embed `null` (ChatButton) é
// coberta lá e pelo uso do client definido em appointments.composition.ts.
describe('GET /api/appointments/list', () => {
  const listMine = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(buildAppointmentsService as jest.Mock).mockReturnValue({ listMine })
  })

  function asUser(id: string | null) {
    ;(createServerClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: id ? { id } : null }, error: id ? null : new Error('no session') }) }
    })
  }

  it('returns 401 when there is no session and never builds the service', async () => {
    asUser(null)
    const res = await GET(makeRequest('?role=mentor'))
    expect(res.status).toBe(401)
    expect(buildAppointmentsService).not.toHaveBeenCalled()
  })

  it('returns the other party fully populated instead of null', async () => {
    asUser('mentor-1')
    listMine.mockResolvedValue([
      { id: 'app-1', status: 'pending', mentor: { id: 'mentor-1', full_name: 'Mentor Teste' }, mentee: { id: 'mentee-1', full_name: 'Mentee Teste' } }
    ])

    const res = await GET(makeRequest('?role=mentor&status=pending'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.count).toBe(1)
    expect(data.appointments[0].mentee.full_name).toBe('Mentee Teste')
    expect(listMine).toHaveBeenCalledWith({ userId: 'mentor-1', role: 'mentor', status: 'pending', limit: 10 })
  })

  it('always filters by the logged user, whatever the query says', async () => {
    asUser('user-1')
    listMine.mockResolvedValue([])
    await GET(makeRequest('?userId=someone-else&limit=50'))
    expect(listMine).toHaveBeenCalledWith({ userId: 'user-1', limit: 50 })
  })

  it('returns 400 for a role, status or limit the API does not accept', async () => {
    asUser('user-1')
    expect((await GET(makeRequest('?role=admin'))).status).toBe(400)
    expect((await GET(makeRequest('?status=rejected'))).status).toBe(400)
    expect((await GET(makeRequest('?limit=100000'))).status).toBe(400)
    expect(listMine).not.toHaveBeenCalled()
  })

  it('returns 500 when the service fails', async () => {
    asUser('user-1')
    listMine.mockRejectedValue(new Error('boom'))
    const res = await GET(makeRequest(''))
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe('Erro ao buscar agendamentos')
  })
})
