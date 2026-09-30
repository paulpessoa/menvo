import { createServiceRoleClient } from "@/lib/utils/supabase/service-role";
import { createClient } from "@/lib/utils/supabase/server";
import { OrganizationLeadInput } from "@/lib/schemas/organization-lead";
import { Database } from "@/lib/types/supabase";

type OrganizationLeadRow = Database['public']['Tables']['organization_leads']['Row'];

/**
 * Cria um novo lead de organização no banco de dados.
 * Utiliza o service role para gravar, já que a tabela não tem policy de insert público.
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

/**
 * Lista leads de organizações. Requer acesso de admin.
 * 
 * @param status Filtra por status (opcional)
 * @returns Lista de leads ordenados por data de criação decrescente
 */
export async function listOrganizationLeads(status?: string): Promise<OrganizationLeadRow[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from('organization_leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar leads de organização: ${error.message}`);
  }

  return data || [];
}

/**
 * Atualiza o status de um lead de organização. Requer acesso de admin.
 *
 * @param id ID do lead
 * @param status Novo status
 * @returns A linha atualizada
 */
export async function updateOrganizationLeadStatus(id: string, status: string): Promise<OrganizationLeadRow> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('organization_leads')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar status do lead: ${error.message}`);
  }

  return data;
}
