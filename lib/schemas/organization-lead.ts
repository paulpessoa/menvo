import { z } from 'zod';

/**
 * Schema de validação para o formulário de "Quero a Menvo na minha organização" (Organization Lead)
 */
export const organizationLeadSchema = z.object({
  org_name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(120, 'Nome deve ter no máximo 120 caracteres'),
  org_type: z.enum(['ngo', 'company', 'school', 'event', 'other']),
  contact_name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(120, 'Nome deve ter no máximo 120 caracteres'),
  contact_email: z.string().email('E-mail inválido').max(254, 'E-mail muito longo'),
  contact_phone: z.string().max(30, 'Telefone muito longo').optional().nullable(),
  people_estimate: z.enum(['1-20', '21-100', '101-500', '500+']),
  message: z.string().max(1000, 'Mensagem deve ter no máximo 1000 caracteres').optional().nullable(),
  website: z.string().optional(), // Honeypot
  locale: z.enum(['pt-BR', 'en', 'es']).optional()
});

export type OrganizationLeadInput = z.infer<typeof organizationLeadSchema>;
