import { createOrganizationLead, listOrganizationLeads, updateOrganizationLeadStatus } from './org-leads.service';
import { createServiceRoleClient } from '@/lib/utils/supabase/service-role';
import { createClient } from '@/lib/utils/supabase/server';

jest.mock('@/lib/utils/supabase/service-role', () => ({
  createServiceRoleClient: jest.fn()
}));

jest.mock('@/lib/utils/supabase/server', () => ({
  createClient: jest.fn()
}));

describe('org-leads.service', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createServiceRoleClient as jest.Mock).mockReturnValue(mockSupabase);
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('createOrganizationLead', () => {
    it('should create an organization lead using service role client', async () => {
      const mockData = { id: 'test-id' };
      mockSupabase.single.mockResolvedValueOnce({ data: mockData, error: null });

      const input = {
        org_name: 'Menvo',
        org_type: 'ngo' as const,
        contact_name: 'Paul',
        contact_email: 'paul@example.com',
        people_estimate: '1-20' as const,
      };

      const result = await createOrganizationLead(input);

      expect(createServiceRoleClient).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('organization_leads');
      expect(mockSupabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        org_name: 'Menvo',
        contact_email: 'paul@example.com'
      }));
      expect(result).toEqual(mockData);
    });
  });

  describe('listOrganizationLeads', () => {
    it('should list organization leads using user client', async () => {
      const mockData = [{ id: 'test-id' }];
      mockSupabase.order.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await listOrganizationLeads();

      expect(createClient).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('organization_leads');
      expect(result).toEqual(mockData);
    });
  });

  describe('updateOrganizationLeadStatus', () => {
    it('should update organization lead status using user client', async () => {
      const mockData = { id: 'test-id', status: 'contacted' };
      mockSupabase.single.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await updateOrganizationLeadStatus('test-id', 'contacted');

      expect(createClient).toHaveBeenCalled();
      expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining({
        status: 'contacted'
      }));
      expect(result).toEqual(mockData);
    });
  });
});
