import { createServiceRoleClient } from "@/lib/utils/supabase/service-role";
import { OrganizationLeadInput } from "@/lib/schemas/organization-lead";
import { Database } from "@/lib/types/supabase";

type OrganizationLeadRow = Database['public']['Tables']['organization_leads']['Row'];

/**
 * Cria um novo lead de organização no banco de dados (formulário público, E8
 * do ADR 0008). Utiliza o service role para gravar, já que a tabela não tem
 * policy de insert público. A leitura e a mudança de status do admin ficam em
 * `lib/services/admin/organizations.service.ts`, pela sessão.
 *
 * @param input Dados do formulário
 * @returns A linha criada
 */
export async function createOrganizationLead(input: OrganizationLeadInput): Promise<OrganizationLeadRow> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('organization_leads')
    .insert({
      org_name: input.org_name,
      org_type: input.org_type,
      contact_name: input.contact_name,
      contact_email: input.contact_email,
      contact_phone: input.contact_phone || null,
      people_estimate: input.people_estimate,
      message: input.message || null,
      locale: input.locale || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar lead de organização: ${error.message}`);
  }

  return data;
}
