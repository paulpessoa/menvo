/**
 * @jest-environment node
 */
import { GET, PATCH } from './route';
import { requireAdmin } from '@/lib/auth/require-admin';
import { buildAdminOrganizationsService } from '@/lib/services/admin/ops.composition';
import { AdminForbiddenError } from '@/lib/services/admin/assert-admin';
import { NextResponse } from 'next/server';

jest.mock('@/lib/auth/require-admin', () => ({
  requireAdmin: jest.fn()
}));

jest.mock('@/lib/utils/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({})
}));

jest.mock('@/lib/services/admin/ops.composition', () => ({
  buildAdminOrganizationsService: jest.fn()
}));

const service = {
  listOrgLeads: jest.fn(),
  setOrgLeadStatus: jest.fn()
};

describe('/api/admin/org-leads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (buildAdminOrganizationsService as jest.Mock).mockReturnValue(service);
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
      service.listOrgLeads.mockResolvedValueOnce(mockLeads);

      const req = new Request('http://localhost:3000/api/admin/org-leads?status=new');
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(service.listOrgLeads).toHaveBeenCalledWith('new');
      const data = await res.json();
      expect(data.leads).toEqual(mockLeads);
    });

    it('should refuse when the service says the caller is not admin', async () => {
      (requireAdmin as jest.Mock).mockResolvedValueOnce({ ok: true });
      service.listOrgLeads.mockRejectedValueOnce(new AdminForbiddenError());

      const res = await GET(new Request('http://localhost:3000/api/admin/org-leads'));
      expect(res.status).toBe(403);
    });

    it('should not leak the database message on failure', async () => {
      (requireAdmin as jest.Mock).mockResolvedValueOnce({ ok: true });
      service.listOrgLeads.mockRejectedValueOnce(new Error('column "x" does not exist'));
      jest.spyOn(console, 'error').mockImplementation(() => undefined);

      const res = await GET(new Request('http://localhost:3000/api/admin/org-leads'));
      expect(res.status).toBe(500);
      expect(JSON.stringify(await res.json())).not.toContain('column');
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
      service.setOrgLeadStatus.mockResolvedValueOnce(mockLead);

      const req = new Request('http://localhost:3000/api/admin/org-leads', {
        method: 'PATCH',
        body: JSON.stringify(mockLead)
      });
      const res = await PATCH(req);

      expect(res.status).toBe(200);
      expect(service.setOrgLeadStatus).toHaveBeenCalledWith(mockLead.id, mockLead.status);
      const data = await res.json();
      expect(data.lead).toEqual(mockLead);
    });

    it('should return 404 when the lead does not exist', async () => {
      (requireAdmin as jest.Mock).mockResolvedValueOnce({ ok: true });
      service.setOrgLeadStatus.mockResolvedValueOnce(null);

      const req = new Request('http://localhost:3000/api/admin/org-leads', {
        method: 'PATCH',
        body: JSON.stringify({ id: '7fcb9253-89bd-4cc7-ab79-11c52d8ccf3d', status: 'closed' })
      });
      const res = await PATCH(req);
      expect(res.status).toBe(404);
    });
  });
});
