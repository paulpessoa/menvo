/**
 * @jest-environment node
 */
import { POST } from './route';
import { NextRequest } from 'next/server';
import { createClient as createServerClient } from '@/lib/utils/supabase/server';
import { buildAppointmentsService } from '@/lib/services/appointments/appointments.composition';
import { RepositoryError } from '@/lib/repositories/repository-error';

jest.mock('@/lib/utils/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/services/appointments/appointments.composition', () => ({ buildAppointmentsService: jest.fn() }));

// A regra (participante, calendário, e-mail, transição) é testada em
// appointments.service.test.ts. Aqui só conferimos auth -> Zod -> service -> HTTP.
describe('POST /api/appointments/cancel', () => {
  const cancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    (buildAppointmentsService as jest.Mock).mockReturnValue({ cancel });
  });

  const sessionClient = { auth: { getUser: jest.fn() } };

  function asUser(id: string | null) {
    sessionClient.auth.getUser.mockResolvedValue({ data: { user: id ? { id } : null }, error: null });
    (createServerClient as jest.Mock).mockResolvedValue(sessionClient);
  }

  function createMockRequest(body: Record<string, unknown>) {
    return new NextRequest('http://localhost:3000/api/appointments/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('should return 401 when user is not authenticated', async () => {
    asUser(null);
    const response = await POST(createMockRequest({ appointmentId: 'app-1', reason: 'Imprevisto' }));
    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe('Não autenticado');
    expect(buildAppointmentsService).not.toHaveBeenCalled();
  });

  it('should return 400 when body validation fails', async () => {
    asUser('user-1');
    const response = await POST(createMockRequest({ appointmentId: '', reason: '' }));
    expect(response.status).toBe(400);
    expect(cancel).not.toHaveBeenCalled();
  });

  it('passes the logged user (never one from the body) to the service and answers 200', async () => {
    asUser('mentor-1');
    cancel.mockResolvedValue({ kind: 'ok' });
    const response = await POST(createMockRequest({ appointmentId: 'app-1', reason: 'Imprevisto', userId: 'someone-else' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, message: 'Agendamento cancelado com sucesso' });
    expect(cancel).toHaveBeenCalledWith('app-1', 'mentor-1', 'Imprevisto');
    // A escrita roda com a sessão do usuário (ADR 0008 §4), não com um client da rota.
    expect(buildAppointmentsService).toHaveBeenCalledWith(sessionClient);
  });

  // PR #109: quem não participa recebe o mesmo 404 de um id que não existe.
  it('should return 404 for a missing appointment or a user who is not a participant', async () => {
    asUser('stranger-1');
    cancel.mockResolvedValue({ kind: 'not_found' });
    const response = await POST(createMockRequest({ appointmentId: 'app-1', reason: 'Tentativa indevida' }));
    expect(response.status).toBe(404);
    expect((await response.json()).error).toBe('Agendamento não encontrado');
  });

  it('should return 400 when appointment is already cancelled', async () => {
    asUser('mentor-1');
    cancel.mockResolvedValue({ kind: 'already_cancelled' });
    const response = await POST(createMockRequest({ appointmentId: 'app-1', reason: 'Outro motivo' }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe('Agendamento já foi cancelado');
  });

  it('should return 403 when the mentee tries to undo a session the mentor already completed', async () => {
    asUser('mentee-1');
    cancel.mockResolvedValue({ kind: 'forbidden' });
    const response = await POST(createMockRequest({ appointmentId: 'app-1', reason: 'Quero desfazer' }));
    expect(response.status).toBe(403);
  });

  it('should return 409 when the status changed meanwhile or the guard refused', async () => {
    asUser('mentor-1');
    cancel.mockResolvedValueOnce({ kind: 'changed' });
    let response = await POST(createMockRequest({ appointmentId: 'app-1', reason: 'motivo válido' }));
    expect(response.status).toBe(409);
    expect((await response.json()).code).toBe('status_changed');

    cancel.mockResolvedValueOnce({ kind: 'invalid_transition', message: 'x' });
    response = await POST(createMockRequest({ appointmentId: 'app-1', reason: 'motivo válido' }));
    expect(response.status).toBe(409);
    expect((await response.json()).code).toBe('invalid_transition');
  });

  it('should return 500 with the old message on a database error', async () => {
    asUser('mentor-1');
    cancel.mockRejectedValue(new RepositoryError('appointments.transitionStatus', { message: 'boom' }));
    const response = await POST(createMockRequest({ appointmentId: 'app-1', reason: 'motivo válido' }));
    expect(response.status).toBe(500);
    expect((await response.json()).error).toBe('Erro ao cancelar agendamento');
  });
});
