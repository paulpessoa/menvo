import { createClient } from '@/lib/utils/supabase/client'
import type { HubResource, HubResourceType, HubResourceStatus } from '@/lib/types/models/hub'

class HubService {
    private supabase = createClient()

    /**
     * Busca todos os recursos publicados no Hub (Público)
     */
    async getPublishedResources(type?: HubResourceType): Promise<HubResource[]> {
        let query = this.supabase
            .from('hub_resources')
            .select('*')
            .eq('status', 'published')
            .order('created_at', { ascending: false })

        if (type && type !== 'all' as any) {
            query = query.eq('type', type)
        }

        const { data, error } = await query
        if (error) throw error
        return data as any as HubResource[]
    }

    /**
     * Busca recursos por status (Apenas Admin)
     */
    async getAdminResources(status: HubResourceStatus): Promise<HubResource[]> {
        const { data, error } = await (this.supabase
            .from('hub_resources')
            .select('*')
            .eq('status', status)
            .order('created_at', { ascending: status === 'pending' }) as any)

        if (error) throw error
        return (data as any[]) || []
    }

    /**
     * Sugere um novo recurso (Comunidade)
     */
    async suggestResource(resource: Omit<HubResource, 'id' | 'status' | 'created_at' | 'updated_at' | 'is_affiliate'>): Promise<HubResource> {
        const { data, error } = await (this.supabase
            .from('hub_resources')
            .insert({
                ...resource,
                status: 'pending'
            } as any)
            .select()
            .single() as any)

        if (error) throw error
        return data as HubResource
    }
}

export const hubService = new HubService()
