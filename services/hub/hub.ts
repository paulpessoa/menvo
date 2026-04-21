import { createClient } from '@/utils/supabase/client'

export type HubResourceType = 'event' | 'course' | 'tool' | 'discount' | 'job'
export type HubResourceStatus = 'pending' | 'published' | 'rejected' | 'archived'

export interface HubResource {
    id: string
    title: string
    description: string | null
    type: HubResourceType
    url: string
    image_url: string | null
    badge_text: string | null
    is_affiliate: boolean
    status: HubResourceStatus
    user_id: string | null
    address?: string | null
    location_url?: string | null
    event_date?: string | null
    event_time?: string | null
    created_at: string
}

class HubService {
    private supabase = createClient()

    /**
     * Busca todos os recursos publicados no Hub (Público)
     */
    async getPublishedResources(type?: HubResourceType) {
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
        return data as HubResource[]
    }

    /**
     * Busca recursos por status (Apenas Admin)
     */
    async getAdminResources(status: HubResourceStatus) {
        const { data, error } = await this.supabase
            .from('hub_resources')
            .select('*')
            .eq('status', status)
            .order('created_at', { ascending: status === 'pending' }) // Pendentes mostram os mais antigos primeiro

        if (error) throw error
        return data as HubResource[]
    }

    /**
     * Sugere um novo recurso (Comunidade)
     */
    async suggestResource(resource: Omit<HubResource, 'id' | 'status' | 'created_at' | 'is_affiliate'>) {
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
