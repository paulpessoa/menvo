/**
 * @jest-environment node
 */
import { GET } from './route';
import { 
  sendAppointmentReminder, 
  sendFeedbackRequest,
  sendPendingRequestReminder,
  sendPendingRequestExpired
} from '@/lib/email/brevo';

jest.mock('@/lib/email/brevo', () => ({
  sendAppointmentReminder: jest.fn().mockResolvedValue(undefined),
  sendFeedbackRequest: jest.fn().mockResolvedValue(undefined),
  sendPendingRequestReminder: jest.fn().mockResolvedValue(undefined),
  sendPendingRequestExpired: jest.fn().mockResolvedValue(undefined)
}));

// Setup encadeável para o Supabase
const mockResults: any[] = [];

const createQueryBuilder = () => {
  const builder: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    then: function(resolve: any) {
      resolve(mockResults.shift() || { data: null, error: null });
    }
  };
  return builder;
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => createQueryBuilder())
  }))
}));

describe('GET /api/cron/appointments', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    mockResults.length = 0; // Limpa as respostas mockadas
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
      CRON_SECRET: 'super-secret-cron-token'
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return 401 when CRON_SECRET is set and authorization header is invalid', async () => {
    const req = new Request('http://localhost:3000/api/cron/appointments', {
      headers: {
        authorization: 'Bearer wrong-secret'
      }
    });

    const res = await GET(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain('Unauthorized');
  });

  it('should process reminders and feedbacks when authorization is valid', async () => {
    const mockAppointmentsToRemind = [
      {
        id: 'app-1',
        scheduled_at: new Date().toISOString(),
        google_meet_link: 'https://meet.google.com/xyz',
        mentor: { full_name: 'Mentor Carlos', email: 'carlos@test.com' },
        mentee: { full_name: 'Mentee Ana', email: 'ana@test.com' }
      }
    ];

    // Configurando os resultados na ordem exata que o cron os chama
    // 1. Expire query -> retorna vazio
    mockResults.push({ data: [], error: null });
    // 2. Reminder pending query -> retorna vazio
    mockResults.push({ data: [], error: null });
    // 3. Reminders do dia -> retorna o mock
    mockResults.push({ data: mockAppointmentsToRemind, error: null });
    // 4. Update reminder do app-1 -> retorna sucesso
    mockResults.push({ data: null, error: null });
    // 5. Feedbacks -> retorna vazio
    mockResults.push({ data: [], error: null });

    const req = new Request('http://localhost:3000/api/cron/appointments', {
      headers: {
        authorization: 'Bearer super-secret-cron-token'
      }
    });

    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.results.reminders).toBe(1);

    expect(sendAppointmentReminder).toHaveBeenCalledTimes(2);
    expect(sendAppointmentReminder).toHaveBeenCalledWith(
      expect.objectContaining({ userEmail: 'ana@test.com' })
    );
    expect(sendAppointmentReminder).toHaveBeenCalledWith(
      expect.objectContaining({ userEmail: 'carlos@test.com' })
    );
  });

  it('should expire pending requests with past scheduled_at and send email to mentee only if updated', async () => {
    const pastDate = new Date(Date.now() - 100000).toISOString();
    const appToCancel = {
      id: 'app-to-cancel',
      status: 'pending',
      scheduled_at: pastDate,
      mentor: { full_name: 'Mentor Expire', email: 'mentor-expire@test.com' },
      mentee: { full_name: 'Mentee Expire', email: 'mentee-expire@test.com' }
    };

    const appToSkip = {
      id: 'app-to-skip',
      status: 'pending',
      scheduled_at: pastDate,
      mentor: { full_name: 'Mentor Skip', email: 'mentor-skip@test.com' },
      mentee: { full_name: 'Mentee Skip', email: 'mentee-skip@test.com' }
    };

    // Ordem das queries:
    // 1. Expire query -> retorna 2 itens
    mockResults.push({ data: [appToCancel, appToSkip], error: null });
    
    // Para appToCancel, o update retorna id (linha atualizada)
    mockResults.push({ data: [{ id: 'app-to-cancel' }], error: null });
    
    // Para appToSkip, o update retorna vazio (mentor confirmou no meio tempo)
    mockResults.push({ data: [], error: null });

    // Restantes:
    // 2. Reminder pending -> vazio
    mockResults.push({ data: [], error: null });
    // 3. Reminders do dia -> vazio
    mockResults.push({ data: [], error: null });
    // 4. Feedbacks -> vazio
    mockResults.push({ data: [], error: null });

    const req = new Request('http://localhost:3000/api/cron/appointments', {
      headers: { authorization: 'Bearer super-secret-cron-token' }
    });

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.results.expired).toBe(1);

    expect(sendPendingRequestExpired).toHaveBeenCalledTimes(1);
    expect(sendPendingRequestExpired).toHaveBeenCalledWith(
      expect.objectContaining({
        menteeEmail: 'mentee-expire@test.com'
      })
    );
  });

  it('should send pending reminder and mark it', async () => {
    const past25h = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    const future1h = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString();
    
    const appToRemind = {
      id: 'app-to-remind-pending',
      status: 'pending',
      created_at: past25h,
      scheduled_at: future1h,
      mentor: { full_name: 'Mentor Pending', email: 'mentor-pending@test.com' },
      mentee: { full_name: 'Mentee Pending', email: 'mentee-pending@test.com' }
    };

    // Ordem das queries:
    // 1. Expire -> vazio
    mockResults.push({ data: [], error: null });
    // 2. Reminder pending query -> retorna o item
    mockResults.push({ data: [appToRemind], error: null });
    // 3. Update pending reminder -> sucesso
    mockResults.push({ data: null, error: null });
    // 4. Reminders do dia -> vazio
    mockResults.push({ data: [], error: null });
    // 5. Feedbacks -> vazio
    mockResults.push({ data: [], error: null });

    const req = new Request('http://localhost:3000/api/cron/appointments', {
      headers: { authorization: 'Bearer super-secret-cron-token' }
    });

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.results.pendingReminders).toBe(1);

    expect(sendPendingRequestReminder).toHaveBeenCalledTimes(1);
    expect(sendPendingRequestReminder).toHaveBeenCalledWith(
      expect.objectContaining({
        mentorEmail: 'mentor-pending@test.com'
      })
    );
  });
});
