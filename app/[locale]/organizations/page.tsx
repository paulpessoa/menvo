"use client"

import { useEffect, useState } from "react"
import { Building2, Search, Loader2, Plus, Globe, ShieldCheck } from "lucide-react"
import { OrganizationCard } from "@/components/organizations/OrganizationCard"
import { MyOrganizations } from "@/components/organizations/MyOrganizations"
import { Organization } from "@/lib/types/organizations"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default function OrganizationsPage() {
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [typeFilter, setTypeFilter] = useState<string>("")
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)

    useEffect(() => {
        fetchOrganizations()
    }, [typeFilter, page])

    const fetchOrganizations = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "12"
            })
            if (typeFilter) params.append("type", typeFilter)
            if (searchQuery) params.append("search", searchQuery)

            const response = await fetch(`/api/organizations?${params}`)
            const result = await response.json()
            console.log("🔍 [DEBUG] Organizations Explore Response:", result)

            if (!response.ok) throw new Error("Erro ao carregar organizações")

            // Suportar tanto { data: { organizations: [] } } quanto { data: [] }
            let orgsList = []
            if (result.data?.organizations && Array.isArray(result.data.organizations)) {
                orgsList = result.data.organizations
            } else if (Array.isArray(result.data)) {
                orgsList = result.data
            } else if (Array.isArray(result.organizations)) {
                orgsList = result.organizations
            }
            
            if (page === 1) {
                setOrganizations(orgsList)
            } else {
                setOrganizations((prev) => [...prev, ...orgsList])
            }
            setHasMore(result.pagination?.page < result.pagination?.totalPages)
        } catch (err) {
            console.error("Error fetching organizations:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = () => {
        setPage(1)
        fetchOrganizations()
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Hero / Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Organizações</h1>
                            <p className="text-lg text-gray-600 max-w-2xl">
                                Conecte-se com ONGs, empresas e comunidades que impulsionam o desenvolvimento profissional através da mentoria voluntária.
                            </p>
                        </div>
                        <Button asChild size="lg" className="bg-primary hover:bg-primary/90 shadow-md">
                            <Link href="/organizations/new" className="flex items-center gap-2">
                                <Plus className="w-5 h-5" />
                                Criar Organização
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Tabs defaultValue="explore" className="w-full space-y-8">
                    <TabsList className="grid w-full max-w-[400px] grid-cols-2 h-12 p-1 bg-gray-200/50">
                        <TabsTrigger value="explore" className="flex items-center gap-2 text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <Globe className="w-4 h-4" /> Explorar
                        </TabsTrigger>
                        <TabsTrigger value="mine" className="flex items-center gap-2 text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <ShieldCheck className="w-4 h-4" /> Minhas Afiliações
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="explore" className="space-y-8 animate-in fade-in duration-500">
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nome ou descrição..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    className="w-full pl-10 pr-4 py-2 border-none bg-transparent focus:ring-0 text-sm"
                                />
                            </div>
                            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
                            <select
                                value={typeFilter}
                                onChange={(e) => {
                                    setTypeFilter(e.target.value)
                                    setPage(1)
                                }}
                                className="px-4 py-2 border-none bg-transparent focus:ring-0 text-sm font-medium cursor-pointer"
                            >
                                <option value="">Todos os tipos</option>
                                <option value="company">Empresa</option>
                                <option value="ngo">ONG</option>
                                <option value="hackathon">Hackathon</option>
                                <option value="sebrae">SEBRAE</option>
                                <option value="community">Comunidade</option>
                            </select>
                            <Button onClick={handleSearch} size="sm">Buscar</Button>
                        </div>

                        {loading && page === 1 ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            </div>
                        ) : organizations.length === 0 ? (
                            <Card className="p-12 text-center border-dashed border-2">
                                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhuma organização encontrada</h3>
                                <p className="text-gray-500 mb-6">Tente ajustar seus filtros ou seja o primeiro a criar uma organização.</p>
                                <Button asChild variant="outline"><Link href="/organizations/new">Criar agora</Link></Button>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {organizations.map((org) => (
                                    <OrganizationCard key={org.id} organization={org} />
                                ))}
                            </div>
                        )}
                        
                        {hasMore && !loading && (
                            <div className="text-center pt-8">
                                <Button variant="ghost" onClick={() => setPage(p => p + 1)} className="text-primary font-bold">
                                    Carregar mais organizações
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="mine" className="animate-in slide-in-from-left-4 duration-500">
                        <MyOrganizations />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
