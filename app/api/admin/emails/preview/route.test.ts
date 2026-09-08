/**
 * @jest-environment node
 */
import { GET } from './route';
import { NextRequest } from 'next/server';

describe('GET /api/admin/emails/preview', () => {
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
