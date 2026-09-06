import { Mail, MessageCircle, ArrowRight, HeartHandshake } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getTranslations } from "next-intl/server"

/**
 * Official Contact Page for Menvo.
 * Handles incoming support, partnerships, and general inquiries with direct channels.
 */
export default async function ContactPage() {
  const t = await getTranslations("contact")

  return (
    <div className="container max-w-5xl mx-auto px-4 py-12 md:py-20">
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

      {/* Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Email Card */}
        <Card className="rounded-3xl border border-primary/15 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="p-8 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-bold">{t("email.title")}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {t("email.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            <div className="p-3.5 rounded-xl bg-muted/50 border border-border text-sm font-semibold text-foreground select-all">
              contato@menvo.com.br
            </div>
            <Button asChild className="w-full rounded-full h-12 font-bold shadow-md shadow-primary/10">
              <a href="mailto:contato@menvo.com.br?subject=Contato%20via%20Menvo">
                <Mail className="w-4 h-4 mr-2" />
                {t("email.action")}
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* WhatsApp Card */}
        <Card className="rounded-3xl border border-emerald-500/20 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="p-8 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-bold">{t("whatsapp.title")}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {t("whatsapp.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            <div className="p-3.5 rounded-xl bg-muted/50 border border-border text-sm font-semibold text-foreground select-all">
              +55 (81) 99509-7377
            </div>
            <Button asChild variant="outline" className="w-full rounded-full h-12 font-bold border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
              <a href="https://wa.me/5581995097377" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4 mr-2" />
                {t("whatsapp.action")}
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info / Partnership Banner */}
      <Card className="rounded-3xl border border-border bg-muted/30 p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-primary" />
              {t("partnerships.title")}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("partnerships.description")}
            </p>
          </div>
          <Button asChild variant="secondary" className="rounded-full font-bold shrink-0">
            <a href="mailto:contato@menvo.com.br?subject=[Parceria]%20Interesse%20Institucional">
              {t("partnerships.action")}
            </a>
          </Button>
        </div>
      </Card>
    </div>
  )
}
