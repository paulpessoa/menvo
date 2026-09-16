"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Mail, Search } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState, useMemo } from "react"

export default function FAQPage() {
    const t = useTranslations()
    const [searchQuery, setSearchQuery] = useState("")

    const faqItems = useMemo(() => {
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => ({
            id: i,
            question: t(`faq.q${i}.question`),
            answer: t(`faq.q${i}.answer`)
        }))
    }, [t])

    const filteredFaqs = useMemo(() => {
        if (!searchQuery.trim()) return faqItems
        const query = searchQuery.toLowerCase()
        return faqItems.filter(item =>
            item.question.toLowerCase().includes(query) ||
            item.answer.toLowerCase().includes(query)
        )
    }, [searchQuery, faqItems])

    // Add structured data for SEO
    useEffect(() => {
        const faqs = faqItems.map(item => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer
            }
        }))

        const script = document.createElement('script')
        script.type = 'application/ld+json'
        script.text = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs
        })
        document.head.appendChild(script)
        return () => {
            document.head.removeChild(script)
        }
    }, [faqItems])

    return (
        <div className="container py-8 md:py-12">
            <div className="flex flex-col items-center text-center space-y-4 mb-12">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">{t("faq.title")}</h1>
                <p className="text-muted-foreground max-w-[800px] md:text-xl">
                    {t("faq.description")}
                </p>
            </div>

            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder={t("faq.search") || "Buscar..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-12 text-base"
                        />
                    </div>
                    {searchQuery && (
                        <p className="text-sm text-muted-foreground mt-2">
                            {filteredFaqs.length} {filteredFaqs.length === 1 ? "resultado" : "resultados"}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {filteredFaqs.length > 0 ? (
                        filteredFaqs.map(faq => (
                            <Card key={faq.id}>
                                <CardHeader>
                                    <CardTitle>{faq.question}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        {faq.answer}
                                    </p>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground text-lg">{t("faq.noResults") || "Nenhum resultado encontrado"}</p>
                        </div>
                    )}
                </div>

                <div className="mt-12 text-center">
                    <h2 className="text-2xl font-bold mb-4">{t("faq.stillHaveQuestions")}</h2>
                    <p className="text-muted-foreground mb-6">
                        {t("faq.supportDescription")}
                    </p>
                    <Button asChild>
                        <Link
                            href="https://wa.me/5581995097377?text=Olá!%20Gostaria%20de%20mais%20informações%20sobre%20o%20suporte."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                        >
                            <Mail className="h-4 w-4" />
                            <span>{t("faq.contactSupport")}</span>
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
