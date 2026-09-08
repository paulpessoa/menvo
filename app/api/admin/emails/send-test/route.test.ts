/**
 * @jest-environment node
 */
import { POST } from './route';
import { NextRequest } from 'next/server';
import * as brevoModule from '@/lib/email/brevo';

jest.mock('@/lib/email/brevo', () => ({
  sendTestEmail: jest.fn(),
  getEmailTemplatePreviewHtml: jest.fn().mockReturnValue('<p>Template Mock</p>')
}));

describe('POST /api/admin/emails/send-test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
