import { z } from 'zod';

/**
 * Schema de validação para o formulário de "Quero a Menvo na minha organização" (Organization Lead)
 */
export const organizationLeadSchema = z.object({
  org_name: z.string().min(2).max(120),
  org_type: z.enum(['ngo', 'company', 'school', 'event', 'other']),
  contact_name: z.string().min(2).max(120),
  contact_email: z.string().email().max(254),
  contact_phone: z.string().max(30).optional().nullable(),
  people_estimate: z.enum(['1-20', '21-100', '101-500', '500+']),
  message: z.string().max(1000).optional().nullable(),
  website: z.string().optional(), // Honeypot
  locale: z.enum(['pt-BR', 'en', 'es']).optional()
});

export type OrganizationLeadInput = z.infer<typeof organizationLeadSchema>;
