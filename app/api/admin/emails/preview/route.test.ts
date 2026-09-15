/**
 * @jest-environment node
 */
import { GET } from './route';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';

jest.mock('@/lib/auth/require-admin', () => ({
  requireAdmin: jest.fn()
}));

const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>;

describe('GET /api/admin/emails/preview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({
      ok: true,
      admin: { userId: 'admin-uuid', role: 'admin' }
    });
  });

  it('should return 403 when the caller is not an admin', async () => {
    mockRequireAdmin.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    });

    const req = new NextRequest('http://localhost:3000/api/admin/emails/preview');
    const res = await GET(req);

    expect(res.status).toBe(403);
  });
  it('should return HTML preview for confirmation template by default', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/emails/preview');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    const html = await res.text();
    expect(html).toContain('Sua mentoria está confirmada!');
    expect(html).toContain('Paul Pessoa');
  });

  it('should return HTML preview for cancellation template', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/emails/preview?template=cancellation');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Mentoria Cancelada');
    expect(html).toContain('Motivo informado:');
    expect(html).not.toContain('Equipe Menvo');
  });

  it('should return HTML preview for verification template', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/emails/preview?template=verification');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Perfil Aprovado');
    expect(html).toContain('Paul Pessoa');
  });
});
