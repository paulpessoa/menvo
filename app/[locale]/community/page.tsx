"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Users, Loader2, MessageSquare, Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MenteeCard } from "@/components/community/MenteeCard"
import { createClient } from "@/utils/supabase/client"
import { useAuth } from "@/lib/auth"
import { useRouter } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

interface UserProfile {
    id: string
    full_name: string | null
    avatar_url: string | null
    bio: string | null
    job_title: string | null
    company: string | null
    linkedin_url: string | null
    github_url: string | null
    expertise_areas: string[] | null
    role: string
}

const ITEMS_PER_PAGE = 12

export default function CommunityPage() {
    const t = useTranslations("community")
    const common = useTranslations("common")
    const [profiles, setProfiles] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const [totalCount, setTotalCount] = useState(0)

    const { user, profile: currentUserProfile } = useAuth()
    const router = useRouter()
    const supabase = createClient()
    
    const isMentor = currentUserProfile?.roles?.includes('mentor') || false

    const fetchProfiles = useCallback(async (isInitial = false) => {
        try {
            const currentPage = isInitial ? 0 : page
            if (isInitial) {
                setLoading(true)
                setPage(0)
            } else {
                setLoadingMore(true)
            }

            const from = currentPage * ITEMS_PER_PAGE
            const to = from + ITEMS_PER_PAGE - 1

            // Buscamos perfis que tenham o papel mentee
            // Nota: Filtramos por quem tem bio ou especialidades para garantir qualidade
            let query = supabase
                .from('profiles')
                .select(`
                    id,
                    full_name,
                    avatar_url,
                    bio,
                    job_title,
                    company,
                    linkedin_url,
                    github_url,
                    expertise_areas,
                    user_roles!inner(roles!inner(name))
                `, { count: 'exact' })
                .eq('user_roles.roles.name', 'mentee')
                .eq('is_public', true)
                .not('bio', 'is', null) // Apenas quem preencheu algo
            
            if (searchTerm) {
                query = query.or(`full_name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%,job_title.ilike.%${searchTerm}%`)
            }

            query = query
                .order('created_at', { ascending: false })
                .range(from, to)

            const { data, error, count } = await query

            if (error) throw error

            const formattedData = (data || []).map((p: any) => ({
                ...p,
                role: 'mentee'
            }))

            if (isInitial) {
                setProfiles(formattedData)
            } else {
                setProfiles(prev => [...prev, ...formattedData])
            }

            setTotalCount(count || 0)
            setHasMore((count || 0) > (from + formattedData.length))
        } catch (error) {
            console.error('Error fetching community profiles:', error)
            toast.error(t("errorLoading"))
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [searchTerm, page, supabase])

    useEffect(() => {
        fetchProfiles(true)
    }, [searchTerm])

    const handleChat = (targetUserId: string) => {
        if (!user) {
            toast.info(common("loginRequired"))
            router.push("/login")
            return
        }
        router.push(`/messages?userId=${targetUserId}`)
    }

    return (
        <div className="container mx-auto px-4 py-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">{t("title")}</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl">
                        {t("subtitle")}
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-primary/5 p-4 rounded-lg border border-primary/10 max-w-xs">
                    <Info className="h-5 w-5 text-primary shrink-0" />
                    <p className="text-xs text-primary/80 leading-snug">
                        {t("mentorTip")}
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md mb-12">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={t("searchPlaceholder")}
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Results Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
                    ))}
                </div>
            ) : profiles.length === 0 ? (
                <div className="text-center py-24 bg-muted/20 rounded-2xl border-2 border-dashed">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <h3 className="text-lg font-semibold">{t("noResults")}</h3>
                    <Button variant="outline" className="mt-4" onClick={() => setSearchTerm("")}>
                        {t("clearSearch")}
                    </Button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {profiles.map((profile) => (
                            <MenteeCard 
                                key={profile.id} 
                                profile={profile} 
                                isMentor={isMentor}
                                onChat={handleChat}
                            />
                        ))}
                    </div>

                    {hasMore && (
                        <div className="mt-12 text-center">
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={() => {setPage(p => p + 1); fetchProfiles(false)}}
                                disabled={loadingMore}
                            >
                                {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {t("loadMore")}
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
