import { Metadata } from "next"
import { Mail, MessageCircle, ArrowRight, HeartHandshake, ShieldAlert } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/routing"
import { OrganizationLeadForm } from "@/components/contact/OrganizationLeadForm"

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "contact" })

  const title = t("title") || "Fale Conosco"
  const description = t("description") || "Entre em contato com a equipe do Menvo para dúvidas, suporte ou parcerias."
  const path = locale === "pt-BR" ? "/contact" : `/${locale}/contact`
  const url = `https://www.menvo.com.br${path}`

  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: {
        "pt-BR": "/contact",
        en: "/en/contact",
        es: "/es/contact"
      }
    },
    openGraph: {
      title: `${title} | Menvo`,
      description,
      url,
      siteName: "Menvo",
      locale,
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Menvo`,
      description
    }
  }
}

/**
 * Official Contact Page for Menvo.
 * Handles incoming support, partnerships, and general inquiries with direct channels.
 */
export default async function ContactPage() {
  const t = await getTranslations("contact")

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto mb-14">
        <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary border-primary/20">
          {t("badge")}
        </Badge>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          {t("description")}
        </p>
      </div>

      {/* Organization form (left) + direct channels (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8 items-start">
        {/* Organization Lead Form */}
        <Card id="organizacao" className="lg:col-span-3 rounded-3xl border border-border scroll-mt-24">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="space-y-1.5">
              <h3 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
                <HeartHandshake className="w-6 h-6 text-primary" />
                {t("partnerships.title")}
              </h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {t("partnerships.description")}
              </p>
            </div>
            <OrganizationLeadForm />
          </CardContent>
        </Card>

        {/* Direct channels */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-3xl border border-primary/15 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="p-6 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <Mail className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl font-bold">{t("email.title")}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {t("email.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="p-3 rounded-xl bg-muted/50 border border-border text-sm font-semibold text-foreground select-all">
                contato@menvo.com.br
              </div>
              <Button asChild className="w-full rounded-full h-11 font-bold shadow-md shadow-primary/10">
                <a href="mailto:contato@menvo.com.br?subject=Contato%20via%20Menvo">
                  <Mail className="w-4 h-4 mr-2" />
                  {t("email.action")}
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-emerald-500/20 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="p-6 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
                <MessageCircle className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl font-bold">{t("whatsapp.title")}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {t("whatsapp.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="p-3 rounded-xl bg-muted/50 border border-border text-sm font-semibold text-foreground select-all">
                +55 (81) 99509-7377
              </div>
              <Button asChild variant="outline" className="w-full rounded-full h-11 font-bold border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                <a href="https://wa.me/5581995097377" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {t("whatsapp.action")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-border bg-muted/30">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">{t("trustSafety.title")}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("trustSafety.description")}
              </p>
              <Button asChild variant="outline" className="w-full rounded-full h-11 font-bold">
                <Link href="/support">
                  <ShieldAlert className="w-4 h-4 mr-2" />
                  {t("trustSafety.action")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
