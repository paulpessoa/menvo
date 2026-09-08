/**
 * @jest-environment node
 */
import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/utils/supabase/server';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('/api/mentors/availability', () => {
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

  describe('GET', () => {
    it('should return 401 when no mentor_id is provided and user is not authenticated', async () => {
      mockServerSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized'),
      });

      const req = new NextRequest('http://localhost:3000/api/mentors/availability');
      const res = await GET(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Não autenticado');
    });

    it('should return slots for authenticated user when mentor_id param is omitted', async () => {
      mockServerSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'mentor-123' } },
        error: null,
      });

      const mockSlots = [
        { id: '1', mentor_id: 'mentor-123', day_of_week: 1, start_time: '09:00:00', end_time: '09:45:00', timezone: 'America/Sao_Paulo' },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockSlots, error: null }),
          }),
        }),
      });

      mockAdminSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const req = new NextRequest('http://localhost:3000/api/mentors/availability');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockSlots);
    });

    it('should return slots when mentor_id is provided in query params without requiring auth', async () => {
      const mockSlots = [
        { id: '2', mentor_id: 'mentor-456', day_of_week: 2, start_time: '14:00:00', end_time: '14:45:00', timezone: 'America/Sao_Paulo' },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockSlots, error: null }),
          }),
        }),
      });

      mockAdminSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const req = new NextRequest('http://localhost:3000/api/mentors/availability?mentor_id=mentor-456');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockSlots);
    });
  });

  describe('POST', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockServerSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized'),
      });

      const req = new NextRequest('http://localhost:3000/api/mentors/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: [] }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('should return 400 when validation fails', async () => {
      mockServerSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'mentor-123' } },
        error: null,
      });

      const req = new NextRequest('http://localhost:3000/api/mentors/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: [{ day_of_week: 99, start_time: '' }] }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Dados de disponibilidade inválidos');
    });

    it('should delete old slots and insert new slots when valid', async () => {
      mockServerSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'mentor-123' } },
        error: null,
      });

      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockInsertedSlots = [
        { id: '10', mentor_id: 'mentor-123', day_of_week: 1, start_time: '09:00:00', end_time: '09:45:00', timezone: 'America/Sao_Paulo' },
      ];

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: mockInsertedSlots, error: null }),
      });

      mockAdminSupabase.from.mockImplementation((table: string) => {
        if (table === 'mentor_availability') {
          return {
            delete: mockDelete,
            insert: mockInsert,
          };
        }
        if (table === 'profiles') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        return {};
      });

      const payload = {
        slots: [
          { day_of_week: 1, start_time: '09:00:00', end_time: '09:45:00', timezone: 'America/Sao_Paulo' },
        ],
        timezone: 'America/Sao_Paulo',
      };

      const req = new NextRequest('http://localhost:3000/api/mentors/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockInsertedSlots);
    });
  });
});
