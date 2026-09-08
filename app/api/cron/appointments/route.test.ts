/**
 * @jest-environment node
 */
import { GET } from './route';
import { sendAppointmentReminder, sendFeedbackRequest } from '@/lib/email/brevo';

jest.mock('@/lib/email/brevo', () => ({
  sendAppointmentReminder: jest.fn().mockResolvedValue(undefined),
  sendFeedbackRequest: jest.fn().mockResolvedValue(undefined)
}));

// Mock Supabase admin client
const mockUpdate = jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });
const mockSelect = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table: string) => ({
      select: mockSelect,
      update: mockUpdate
    }))
  }))
}));

describe('GET /api/cron/appointments', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
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
    // Mock reminders query
    const mockAppointmentsToRemind = [
      {
        id: 'app-1',
        scheduled_at: new Date().toISOString(),
        google_meet_link: 'https://meet.google.com/xyz',
        mentor: { full_name: 'Mentor Carlos', email: 'carlos@test.com' },
        mentee: { full_name: 'Mentee Ana', email: 'ana@test.com' }
      }
    ];

    // Mock query chains
    mockSelect
      .mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          is: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockResolvedValue({
                data: mockAppointmentsToRemind,
                error: null
              })
            })
          })
        })
      })
      .mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          is: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

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

    // Expect reminder emails sent to both
    expect(sendAppointmentReminder).toHaveBeenCalledTimes(2);
    expect(sendAppointmentReminder).toHaveBeenCalledWith(
      expect.objectContaining({ userEmail: 'ana@test.com' })
    );
    expect(sendAppointmentReminder).toHaveBeenCalledWith(
      expect.objectContaining({ userEmail: 'carlos@test.com' })
    );
  });
});
