"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Plus, ExternalLink, Calendar, BookOpen, Wrench, Tag, Briefcase, Loader2, Info } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { hubService, type HubResource, type HubResourceType } from "@/services/hub/hub"

export default function HubPage() {
    const t = useTranslations("hub")
    const common = useTranslations("common")
    const [resources, setResources] = useState<HubResource[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [activeTab, setActiveTab] = useState<string>("all")

    useEffect(() => {
        fetchResources()
    }, [activeTab])

    const fetchResources = async () => {
        setLoading(true)
        try {
            const data = await hubService.getPublishedResources(activeTab as HubResourceType)
            setResources(data)
        } catch (error) {
            console.error('Error fetching hub resources:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredResources = resources.filter(res =>
        res.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'event': return <Calendar className="h-4 w-4" />
            case 'course': return <BookOpen className="h-4 w-4" />
            case 'tool': return <Wrench className="h-4 w-4" />
            case 'discount': return <Tag className="h-4 w-4" />
            case 'job': return <Briefcase className="h-4 w-4" />
            default: return <Info className="h-4 w-4" />
        }
    }

    return (
        <div className="container mx-auto px-4 py-12">
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Menvo Hub</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl">
                        {t("subtitle")}
                    </p>
                </div>
                <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-all">
                    <Link href="/hub/suggest">
                        <Plus className="mr-2 h-5 w-5" /> {t("suggestBtn")}
                    </Link>
                </Button>
            </div>

            {/* Filters and Search */}
            <div className="space-y-6 mb-12">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t("searchPlaceholder")}
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                        <TabsList className="grid grid-cols-3 md:flex w-full">
                            <TabsTrigger value="all">{t("tabs.all")}</TabsTrigger>
                            <TabsTrigger value="event">{t("tabs.events")}</TabsTrigger>
                            <TabsTrigger value="course">{t("tabs.courses")}</TabsTrigger>
                            <TabsTrigger value="tool">{t("tabs.tools")}</TabsTrigger>
                            <TabsTrigger value="discount" className="hidden md:flex">{t("tabs.discounts")}</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {/* Results Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">{common("loading")}</p>
                </div>
            ) : filteredResources.length === 0 ? (
                <div className="text-center py-24 bg-muted/30 rounded-2xl border-2 border-dashed">
                    <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">{t("noResults.title")}</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                        {t("noResults.description")}
                    </p>
                    <Button variant="outline" className="mt-6" onClick={() => {setSearchTerm(""); setActiveTab("all")}}>
                        {t("noResults.clear")}
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResources.map((item) => (
                        <Card key={item.id} className="group hover:shadow-xl transition-all duration-300 flex flex-col border-2 hover:border-primary/20 overflow-hidden">
                            {item.image_url && (
                                <div className="relative h-48 w-full overflow-hidden">
                                    <Image
                                        src={item.image_url}
                                        alt={item.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {item.badge_text && (
                                        <Badge className="absolute top-4 right-4 shadow-md" variant="default">
                                            {item.badge_text}
                                        </Badge>
                                    )}
                                </div>
                            )}
                            <CardHeader className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <Badge variant="secondary" className="flex items-center gap-1.5 font-medium py-1">
                                        {getTypeIcon(item.type)}
                                        {t(`types.${item.type}`)}
                                    </Badge>
                                    {item.is_affiliate && (
                                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider opacity-60">
                                            Partner
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                                    {item.title}
                                </CardTitle>
                                <CardDescription className="line-clamp-3 mt-2 text-sm leading-relaxed">
                                    {item.description}
                                </CardDescription>
                            </CardHeader>
                            <CardFooter className="pt-0 pb-6 px-6 mt-auto">
                                <Button className="w-full font-semibold" asChild>
                                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                                        {t("viewMore")} <ExternalLink className="ml-2 h-4 w-4" />
                                    </a>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
