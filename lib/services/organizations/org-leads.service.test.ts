import { createOrganizationLead } from './org-leads.service';
import { createServiceRoleClient } from '@/lib/utils/supabase/service-role';

jest.mock('@/lib/utils/supabase/service-role', () => ({
  createServiceRoleClient: jest.fn()
}));

describe('org-leads.service', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createServiceRoleClient as jest.Mock).mockReturnValue(mockSupabase);
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
});
