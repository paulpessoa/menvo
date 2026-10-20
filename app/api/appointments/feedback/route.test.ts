/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { GET, PATCH } from './route'
import { createClient as createServerClient } from '@/lib/utils/supabase/server'
import { buildAppointmentsService } from '@/lib/services/appointments/appointments.composition'

jest.mock('@/lib/utils/supabase/server', () => ({ createClient: jest.fn() }))
jest.mock('@/lib/services/appointments/appointments.composition', () => ({ buildAppointmentsService: jest.fn() }))

describe('/api/appointments/feedback', () => {
  const listFeedbacks = jest.fn()
  const updateOwnFeedback = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(buildAppointmentsService as jest.Mock).mockReturnValue({ listFeedbacks, updateOwnFeedback })
  })

  function asUser(id: string | null) {
    ;(createServerClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: id ? { id } : null }, error: id ? null : new Error('no session') }) }
    })
  }

  const get = (qs = '') => GET(new NextRequest(`http://localhost:3000/api/appointments/feedback${qs}`))
  const patch = (body: unknown) =>
    PATCH(
      new NextRequest('http://localhost:3000/api/appointments/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    )

  describe('GET', () => {
    it('returns 401 without a session', async () => {
      asUser(null)
      expect((await get()).status).toBe(401)
      expect(buildAppointmentsService).not.toHaveBeenCalled()
    })

    it('lists received by default and sent on request, always for the logged user', async () => {
      asUser('u1')
      listFeedbacks.mockResolvedValue([{ id: 'f1' }])
      let res = await get('?userId=someone-else')
      expect(listFeedbacks).toHaveBeenLastCalledWith('u1', 'received')
      expect(await res.json()).toEqual({ feedbacks: [{ id: 'f1' }] })

      await get('?type=sent')
      expect(listFeedbacks).toHaveBeenLastCalledWith('u1', 'sent')
    })

    it('returns 500 with the old message when the service fails', async () => {
      asUser('u1')
      listFeedbacks.mockRejectedValue(new Error('boom'))
      const res = await get()
      expect(res.status).toBe(500)
      expect((await res.json()).error).toBe('Erro ao buscar avaliações')
    })
  })

  describe('PATCH', () => {
    it('returns 401 without a session and 400 for an empty comment', async () => {
      asUser(null)
      expect((await patch({ feedbackId: 'f1', publicFeedback: 'x' })).status).toBe(401)
      asUser('u1')
      expect((await patch({ feedbackId: 'f1', publicFeedback: '' })).status).toBe(400)
      expect(updateOwnFeedback).not.toHaveBeenCalled()
    })

    it('passes the logged user to the service and answers 200', async () => {
      asUser('u1')
      updateOwnFeedback.mockResolvedValue({ kind: 'ok' })
      const res = await patch({ feedbackId: 'f1', publicFeedback: 'novo', reviewerId: 'attacker' })
      expect(res.status).toBe(200)
      expect(updateOwnFeedback).toHaveBeenCalledWith('f1', 'u1', 'novo')
    })

    it.each([
      [{ kind: 'not_found' }, 404, 'Avaliação não encontrada'],
      [{ kind: 'forbidden' }, 403, 'Você só pode editar suas próprias avaliações']
    ])('maps %j to %i with the same message as before', async (result, status, message) => {
      asUser('u1')
      updateOwnFeedback.mockResolvedValue(result)
      const res = await patch({ feedbackId: 'f1', publicFeedback: 'x' })
      expect(res.status).toBe(status)
      expect((await res.json()).error).toBe(message)
    })

    it('returns 500 with the old message when the service fails', async () => {
      asUser('u1')
      updateOwnFeedback.mockRejectedValue(new Error('boom'))
      const res = await patch({ feedbackId: 'f1', publicFeedback: 'x' })
      expect(res.status).toBe(500)
      expect((await res.json()).error).toBe('Erro ao atualizar avaliação')
    })
  })
})
