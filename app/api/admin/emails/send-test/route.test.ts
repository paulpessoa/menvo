/**
 * @jest-environment node
 */
import { POST } from './route';
import { NextRequest, NextResponse } from 'next/server';
import * as brevoModule from '@/lib/email/brevo';
import { requireAdmin } from '@/lib/auth/require-admin';

jest.mock('@/lib/email/brevo', () => ({
  sendTestEmail: jest.fn(),
  getEmailTemplatePreviewHtml: jest.fn().mockReturnValue('<p>Template Mock</p>')
}));

jest.mock('@/lib/auth/require-admin', () => ({
  requireAdmin: jest.fn()
}));

const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>;

describe('POST /api/admin/emails/send-test', () => {
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

    const req = new NextRequest('http://localhost:3000/api/admin/emails/send-test', {
      method: 'POST',
      body: JSON.stringify({ email: 'valid@menvo.com.br', template: 'confirmation' })
    });
    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(brevoModule.sendTestEmail).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid email address', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/emails/send-test', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid-email', template: 'confirmation' })
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Por favor, insira um e-mail válido.');
  });

  it('should return 400 for missing template', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/emails/send-test', {
      method: 'POST',
      body: JSON.stringify({ email: 'teste@exemplo.com' })
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('should return 502 when brevo service fails', async () => {
    (brevoModule.sendTestEmail as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: 'API Key inválida'
    });

    const req = new NextRequest('http://localhost:3000/api/admin/emails/send-test', {
      method: 'POST',
      body: JSON.stringify({ email: 'teste@exemplo.com', template: 'confirmation' })
    });
    const res = await POST(req);

    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toBe('API Key inválida');
  });

  it('should return 200 when test email is dispatched successfully', async () => {
    (brevoModule.sendTestEmail as jest.Mock).mockResolvedValueOnce({
      success: true
    });

    const req = new NextRequest('http://localhost:3000/api/admin/emails/send-test', {
      method: 'POST',
      body: JSON.stringify({ email: 'contato@menvo.com.br', template: 'confirmation' })
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('contato@menvo.com.br');
    expect(brevoModule.sendTestEmail).toHaveBeenCalledWith({
      to: 'contato@menvo.com.br',
      templateKey: 'confirmation'
    });
  });
});
