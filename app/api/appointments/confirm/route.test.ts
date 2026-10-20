/**
 * @jest-environment node
 */
import { POST } from './route'
import { NextRequest } from 'next/server'
import { createClient as createServerClient } from '@/lib/utils/supabase/server'
import { buildAppointmentsService } from '@/lib/services/appointments/appointments.composition'
import { RepositoryError } from '@/lib/repositories/repository-error'

jest.mock('@/lib/utils/supabase/server', () => ({ createClient: jest.fn() }))
jest.mock('@/lib/services/appointments/appointments.composition', () => ({ buildAppointmentsService: jest.fn() }))

// A regra (token x sessão, ordem status/calendário/e-mail) é testada em
// appointments.service.test.ts. Aqui: Zod, de onde vem a sessão e o mapa para HTTP.
describe('POST /api/appointments/confirm', () => {
  const confirm = jest.fn()
  let getUser: jest.Mock

  function createMockRequest(body: Record<string, unknown>) {
    return new NextRequest('http://localhost:3000/api/appointments/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(buildAppointmentsService as jest.Mock).mockReturnValue({ confirm })
    getUser = jest.fn()
    ;(createServerClient as jest.Mock).mockResolvedValue({ auth: { getUser } })
  })

  it('returns 400 when neither a token nor an appointmentId is sent', async () => {
    const res = await POST(createMockRequest({}))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Dados inválidos')
    expect(confirm).not.toHaveBeenCalled()
  })

  it('confirms via token without requiring (or reading) a session', async () => {
    confirm.mockResolvedValue({ kind: 'ok', googleEventId: null, googleMeetLink: null, calendarError: null })
    const res = await POST(createMockRequest({ token: 'a-secret-token' }))

    expect(res.status).toBe(200)
    expect(getUser).not.toHaveBeenCalled()
    expect(confirm).toHaveBeenCalledWith({ token: 'a-secret-token', appointmentId: undefined, mentorNotes: undefined, sessionUserId: null })
    expect((await res.json()).message).toBe('Mentoria confirmada (evento do Calendar não foi criado)')
  })

  it('passes the session user (never one from the body) on the appointmentId path', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'mentor-1' } }, error: null })
    confirm.mockResolvedValue({ kind: 'ok', googleEventId: 'evt', googleMeetLink: 'https://meet/x', calendarError: null })

    const res = await POST(createMockRequest({ appointmentId: 'app-1', mentorNotes: 'Tudo certo', userId: 'attacker' }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(confirm).toHaveBeenCalledWith({ token: undefined, appointmentId: 'app-1', mentorNotes: 'Tudo certo', sessionUserId: 'mentor-1' })
    expect(data).toMatchObject({ success: true, googleEventId: 'evt', message: 'Mentoria confirmada e evento criado no Google Calendar' })
  })

  it('sends a null session user when nobody is logged in on the appointmentId path', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new Error('no session') })
    confirm.mockResolvedValue({ kind: 'forbidden' })

    const res = await POST(createMockRequest({ appointmentId: 'app-1' }))

    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ sessionUserId: null }))
    expect(res.status).toBe(403)
    expect((await res.json()).error).toBe('Não autorizado a confirmar este agendamento')
  })

  it.each([
    [{ kind: 'not_found' }, 404, 'Agendamento não encontrado ou token inválido'],
    [{ kind: 'wrong_status', status: 'cancelled' }, 400, 'Este agendamento está com status: cancelled'],
  ])('maps %j to %i with the same message as before', async (result, status, message) => {
    confirm.mockResolvedValue(result)
    const res = await POST(createMockRequest({ token: 't' }))
    expect(res.status).toBe(status)
    expect((await res.json()).error).toBe(message)
  })

  it('answers 410 with a clear message when the e-mail link has expired', async () => {
    confirm.mockResolvedValue({ kind: 'token_expired' })
    const res = await POST(createMockRequest({ token: 't' }))
    const data = await res.json()
    expect(res.status).toBe(410)
    expect(data.code).toBe('token_expired')
    expect(data.error).toMatch(/^Este link expirou/)
  })

  it('answers 200 with alreadyConfirmed for a repeated click', async () => {
    confirm.mockResolvedValue({ kind: 'already_confirmed' })
    const res = await POST(createMockRequest({ token: 't' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      success: true,
      message: 'Este agendamento já foi confirmado anteriormente!',
      alreadyConfirmed: true
    })
  })

  it('answers 409 when the status changed meanwhile', async () => {
    confirm.mockResolvedValue({ kind: 'changed' })
    const res = await POST(createMockRequest({ token: 't' }))
    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe('status_changed')
  })

  it('answers 500 with the old message on a database error', async () => {
    confirm.mockRejectedValue(new RepositoryError('appointments.transitionStatus', { message: 'boom' }))
    const res = await POST(createMockRequest({ token: 't' }))
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe('Erro ao atualizar agendamento')
  })
})
