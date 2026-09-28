/**
 * @jest-environment node
 */
import { POST } from './route';
import { createOrganizationLead } from '@/lib/services/organizations/org-leads.service';
import { sendAdminNewOrganizationLead } from '@/lib/email/brevo';
import { checkRateLimit } from '@/lib/rate-limit';

jest.mock('@/lib/services/organizations/org-leads.service', () => ({
  createOrganizationLead: jest.fn()
}));

jest.mock('@/lib/email/brevo', () => ({
  sendAdminNewOrganizationLead: jest.fn()
}));

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn()
}));

describe('POST /api/contact/organization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkRateLimit as jest.Mock).mockReturnValue({ allowed: true });
  });

  it('should return 429 when rate limit is exceeded', async () => {
    (checkRateLimit as jest.Mock).mockReturnValue({ allowed: false });
    
    const req = new Request('http://localhost:3000/api/contact/organization', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it('should return 400 for invalid payload', async () => {
    const req = new Request('http://localhost:3000/api/contact/organization', {
      method: 'POST',
      body: JSON.stringify({ org_name: '' }) // Invalid
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should return 201 without creating lead if honeypot is filled', async () => {
    const payload = {
      org_name: 'Menvo',
      org_type: 'ngo',
      contact_name: 'Paul',
      contact_email: 'paul@example.com',
      people_estimate: '1-20',
      website: 'http://spam.com' // honeypot
    };

    const req = new Request('http://localhost:3000/api/contact/organization', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(createOrganizationLead).not.toHaveBeenCalled();
    expect(sendAdminNewOrganizationLead).not.toHaveBeenCalled();
  });

  it('should return 201, create lead, and send email on success', async () => {
    const payload = {
      org_name: 'Menvo',
      org_type: 'ngo',
      contact_name: 'Paul',
      contact_email: 'paul@example.com',
      people_estimate: '1-20',
      message: 'Hello'
    };

    (createOrganizationLead as jest.Mock).mockResolvedValueOnce({
      ...payload,
      id: 'uuid-123'
    });

    const req = new Request('http://localhost:3000/api/contact/organization', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(createOrganizationLead).toHaveBeenCalledWith(expect.objectContaining(payload));
    expect(sendAdminNewOrganizationLead).toHaveBeenCalled();
  });

  it('should return 201 even if email sending fails', async () => {
    const payload = {
      org_name: 'Menvo',
      org_type: 'ngo',
      contact_name: 'Paul',
      contact_email: 'paul@example.com',
      people_estimate: '1-20'
    };

    (createOrganizationLead as jest.Mock).mockResolvedValueOnce({
      ...payload,
      id: 'uuid-123'
    });

    (sendAdminNewOrganizationLead as jest.Mock).mockRejectedValueOnce(new Error('Email failed'));

    const req = new Request('http://localhost:3000/api/contact/organization', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(createOrganizationLead).toHaveBeenCalled();
  });
});
