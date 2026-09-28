/**
 * @jest-environment node
 */
import { GET, PATCH } from './route';
import { requireAdmin } from '@/lib/auth/require-admin';
import { listOrganizationLeads, updateOrganizationLeadStatus } from '@/lib/services/organizations/org-leads.service';
import { NextResponse } from 'next/server';

jest.mock('@/lib/auth/require-admin', () => ({
  requireAdmin: jest.fn()
}));

jest.mock('@/lib/services/organizations/org-leads.service', () => ({
  listOrganizationLeads: jest.fn(),
  updateOrganizationLeadStatus: jest.fn()
}));

describe('/api/admin/org-leads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 401/403 if not admin', async () => {
      (requireAdmin as jest.Mock).mockResolvedValueOnce({
        ok: false,
        response: NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      });

      const req = new Request('http://localhost:3000/api/admin/org-leads');
      const res = await GET(req);
      expect(res.status).toBe(403);
    });

    it('should return leads on success', async () => {
      (requireAdmin as jest.Mock).mockResolvedValueOnce({ ok: true });
      const mockLeads = [{ id: '1' }];
      (listOrganizationLeads as jest.Mock).mockResolvedValueOnce(mockLeads);

      const req = new Request('http://localhost:3000/api/admin/org-leads?status=new');
      const res = await GET(req);
      
      expect(res.status).toBe(200);
      expect(listOrganizationLeads).toHaveBeenCalledWith('new');
      const data = await res.json();
      expect(data.leads).toEqual(mockLeads);
    });
  });

  describe('PATCH', () => {
    it('should return 401/403 if not admin', async () => {
      (requireAdmin as jest.Mock).mockResolvedValueOnce({
        ok: false,
        response: NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      });

      const req = new Request('http://localhost:3000/api/admin/org-leads', {
        method: 'PATCH',
        body: JSON.stringify({ id: '123', status: 'contacted' })
      });
      const res = await PATCH(req);
      expect(res.status).toBe(403);
    });

    it('should return 400 for invalid payload', async () => {
      (requireAdmin as jest.Mock).mockResolvedValueOnce({ ok: true });
      
      const req = new Request('http://localhost:3000/api/admin/org-leads', {
        method: 'PATCH',
        body: JSON.stringify({ id: '123', status: 'invalid-status' }) // id not uuid, status invalid
      });
      const res = await PATCH(req);
      
      expect(res.status).toBe(400);
    });

    it('should update status on success', async () => {
      (requireAdmin as jest.Mock).mockResolvedValueOnce({ ok: true });
      const mockLead = { id: '7fcb9253-89bd-4cc7-ab79-11c52d8ccf3d', status: 'contacted' };
      (updateOrganizationLeadStatus as jest.Mock).mockResolvedValueOnce(mockLead);

      const req = new Request('http://localhost:3000/api/admin/org-leads', {
        method: 'PATCH',
        body: JSON.stringify(mockLead)
      });
      const res = await PATCH(req);
      
      expect(res.status).toBe(200);
      expect(updateOrganizationLeadStatus).toHaveBeenCalledWith(mockLead.id, mockLead.status);
      const data = await res.json();
      expect(data.lead).toEqual(mockLead);
    });
  });
});
