"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Heart,
  Gift,
  BookOpen,
  Users,
  Trophy,
  ArrowRight,
  Copy,
  Sparkles,
  ShieldCheck,
  Check
} from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { useState } from "react"

export default function DonatePage() {
  const t = useTranslations("donate")
  const [copied, setCopied] = useState(false)
  const pixKey = "pix@menvo.com.br"

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey)
    setCopied(true)
    toast.success("Chave PIX copiada com sucesso!")
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <Badge variant="outline" className="mb-4">
          <Heart className="h-4 w-4 mr-1 text-rose-500" /> {t("hero.badge")}
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          {t("hero.title")}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t("hero.description")}
        </p>
      </div>

      {/* Impact Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-center space-y-4">
          <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto transform -rotate-6">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {t("impact.mentees.title")}
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            {t("impact.mentees.description")}
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-center space-y-4">
          <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto transform rotate-3">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {t("impact.sessions.title")}
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            {t("impact.sessions.description")}
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-center space-y-4">
          <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto transform -rotate-3">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {t("impact.volunteer.title")}
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            {t("impact.volunteer.description")}
          </p>
        </div>
      </div>

      {/* Donation Section - Only PIX & Transparent Support */}
      <div id="pix-card" className="max-w-2xl mx-auto mb-24 scroll-mt-24">
        <Card className="rounded-[2.5rem] border-primary/20 shadow-2xl overflow-hidden bg-white relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary/80 via-primary to-primary/60" />
          
          <CardHeader className="text-center pt-8 pb-4">
            <Badge variant="secondary" className="w-fit mx-auto mb-3 bg-primary/10 text-primary border-none px-3.5 py-1 font-semibold rounded-full">
              <Heart className="h-3.5 w-3.5 mr-1.5 fill-primary text-primary" /> Apoio Voluntário
            </Badge>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Doe Qualquer Valor via PIX
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground max-w-md mx-auto pt-2 leading-relaxed">
              Contribua de forma rápida e segura. Toda doação é investida diretamente na infraestrutura e nos servidores do Menvo.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col items-center px-6 sm:px-12 pb-10 space-y-6">
            {/* QR Code Container */}
            <div className="p-5 bg-gradient-to-b from-gray-50 to-white rounded-3xl border-2 border-dashed border-gray-200 shadow-sm flex flex-col items-center">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center">
                <Image
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=pix@menvo.com.br`}
                  alt="QR Code PIX Menvo"
                  width={200}
                  height={200}
                  className="rounded-xl"
                  unoptimized
                />
              </div>
              <p className="text-xs text-muted-foreground mt-3 font-medium flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Abra o app do seu banco e aponte a câmera
              </p>
            </div>

            {/* Chave PIX Copy Field */}
            <div className="w-full max-w-md space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Chave PIX Oficial
              </Label>
              <div className="flex items-center gap-2 p-2 bg-muted/60 border border-border/80 rounded-2xl">
                <code className="text-sm font-semibold text-gray-800 px-3 flex-1 select-all overflow-hidden text-ellipsis">
                  {pixKey}
                </code>
                <Button
                  onClick={copyPixKey}
                  className="rounded-xl px-4 h-10 font-bold shadow-sm shrink-0"
                  size="sm"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1.5 text-green-400" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1.5" /> Copiar
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Valores Sugeridos */}
            <div className="w-full max-w-md pt-2 border-t border-gray-100">
              <p className="text-xs font-medium text-center text-muted-foreground mb-3">
                Sugestões de contribuição espontânea:
              </p>
              <div className="grid grid-cols-4 gap-2 text-center">
                {["R$ 5", "R$ 15", "R$ 30", "R$ 50"].map((val) => (
                  <div
                    key={val}
                    className="py-2.5 px-2 rounded-xl border border-border/60 bg-muted/30 text-xs font-bold text-gray-800 hover:border-primary hover:bg-primary/5 transition-all cursor-default"
                  >
                    {val}
                  </div>
                ))}
              </div>
            </div>

            {/* Segurança e Confidencialidade */}
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground bg-primary/5 p-3.5 rounded-2xl w-full max-w-md border border-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
              <span>
                Doação 100% segura e voluntária. O Menvo é gratuito e mantido pela comunidade.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How We Use Donations */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          {t("usage.title")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="flex gap-4">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {t("usage.items.mentors.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("usage.items.mentors.description")}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {t("usage.items.events.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("usage.items.events.description")}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {t("usage.items.education.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("usage.items.education.description")}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {t("usage.items.platform.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("usage.items.platform.description")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mb-16 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">
          {t("faq.title")}
        </h2>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("faq.q1.question")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{t("faq.q1.answer")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("faq.q2.question")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{t("faq.q2.answer")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("faq.q3.question")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{t("faq.q3.answer")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("faq.q4.question")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{t("faq.q4.answer")}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">{t("cta.title")}</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          {t("cta.description")}
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="#pix-card">
              {t("cta.primary")} <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/about">{t("cta.secondary")}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
