"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useEffect } from "react"

export default function FAQPage() {
    const { t } = useTranslation()

    // Add structured data for SEO
    useEffect(() => {
        const script = document.createElement('script')
        script.type = 'application/ld+json'
        script.text = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": Array.from({ length: 10 }, (_, i) => ({
                "@type": "Question",
                "name": t(`faq.q${i + 1}.question`),
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": t(`faq.q${i + 1}.answer`)
                }
            }))
        })
        document.head.appendChild(script)
        return () => {
            document.head.removeChild(script)
        }
    }, [t])

    return (
        <div className="container py-8 md:py-12">
            <div className="flex flex-col items-center text-center space-y-4 mb-12">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">{t("faq.title")}</h1>
                <p className="text-muted-foreground max-w-[800px] md:text-xl">
                    {t("faq.description")}
                </p>
            </div>

            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("faq.q1.question")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                {t("faq.q1.answer")}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("faq.q2.question")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                {t("faq.q2.answer")}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("faq.q3.question")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                {t("faq.q3.answer")}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("faq.q4.question")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                {t("faq.q4.answer")}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("faq.q5.question")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                {t("faq.q5.answer")}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("faq.q6.question")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                {t("faq.q6.answer")}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("faq.q7.question")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                {t("faq.q7.answer")}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("faq.q8.question")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                {t("faq.q8.answer")}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("faq.q9.question")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                {t("faq.q9.answer")}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("faq.q10.question")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                {t("faq.q10.answer")}
                            </p>
                        </CardContent>
                    </Card>
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
