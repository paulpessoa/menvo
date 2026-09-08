/**
 * @jest-environment node
 */
import { POST } from './route';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/utils/supabase/server';
import { sendAppointmentCancellation } from '@/lib/email/brevo';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/email/brevo', () => ({
  sendAppointmentCancellation: jest.fn().mockResolvedValue(undefined),
}));

describe('POST /api/appointments/cancel', () => {
  let mockServerSupabase: any;
  let mockAdminSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockServerSupabase = {
      auth: {
        getUser: jest.fn(),
      },
    };
    (createServerClient as jest.Mock).mockResolvedValue(mockServerSupabase);

    mockAdminSupabase = {
      from: jest.fn(),
    };
    (createClient as jest.Mock).mockReturnValue(mockAdminSupabase);
  });

  function createMockRequest(body: Record<string, any>) {
    return new NextRequest('http://localhost:3000/api/appointments/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('should return 401 when user is not authenticated', async () => {
    mockServerSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Unauthorized'),
    });

    const req = createMockRequest({ appointmentId: 'app-1', reason: 'Imprevisto' });
    const response = await POST(req);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Não autenticado');
  });

  it('should return 400 when body validation fails', async () => {
    mockServerSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const req = createMockRequest({ appointmentId: '', reason: '' });
    const response = await POST(req);

    expect(response.status).toBe(400);
  });

  it('should return 404 when appointment does not exist', async () => {
    mockServerSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      }),
    });

    mockAdminSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    const req = createMockRequest({ appointmentId: 'app-999', reason: 'Conflito de agenda' });
    const response = await POST(req);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Agendamento não encontrado');
  });

  it('should return 400 when appointment is already cancelled', async () => {
    mockServerSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'mentor-1' } },
      error: null,
    });

    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'app-1',
            status: 'cancelled',
            mentor: { id: 'mentor-1', full_name: 'Mentor Silva', email: 'mentor@menvo.com.br' },
            mentee: { id: 'mentee-1', full_name: 'Mentorado Souza', email: 'mentee@menvo.com.br' },
          },
          error: null,
        }),
      }),
    });

    mockAdminSupabase.from.mockReturnValue({
      select: mockSelect,
    });

    const req = createMockRequest({ appointmentId: 'app-1', reason: 'Outro motivo' });
    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Agendamento já foi cancelado');
  });

  it('should successfully cancel appointment and trigger email notification to the counterpart', async () => {
    mockServerSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'mentor-1' } },
      error: null,
    });

    const mockAppointment = {
      id: 'app-1',
      status: 'confirmed',
      scheduled_at: '2026-09-15T14:00:00Z',
      mentor: { id: 'mentor-1', full_name: 'Dr. Mentor', email: 'mentor@menvo.com.br' },
      mentee: { id: 'mentee-1', full_name: 'Aluno João', email: 'joao@example.com' },
    };

    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: mockAppointment, error: null }),
      }),
    });

    mockAdminSupabase.from.mockImplementation((table: string) => {
      if (table === 'appointments') {
        return {
          select: mockSelect,
          update: mockUpdate,
        };
      }
      return {};
    });

    const req = createMockRequest({ appointmentId: 'app-1', reason: 'Imprevisto de saúde' });
    const response = await POST(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    expect(sendAppointmentCancellation).toHaveBeenCalledWith({
      recipientEmail: 'joao@example.com',
      recipientName: 'Aluno João',
      otherPersonName: 'Dr. Mentor',
      scheduledAt: '2026-09-15T14:00:00Z',
      reason: 'Imprevisto de saúde',
      cancelledByName: 'Dr. Mentor',
    });
  });
});
