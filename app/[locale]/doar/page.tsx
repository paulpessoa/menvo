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
import {
  Heart,
  Coffee,
  Gift,
  BookOpen,
  Users,
  Trophy,
  ArrowRight,
  ExternalLink,
  Copy
} from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

export default function DonatePage() {
  const t = useTranslations("donate")

  const copyPixKey = () => {
    navigator.clipboard.writeText("contato@menvo.com.br")
    toast.success(t("pix.copySuccess"))
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

      {/* Donation Options */}
      <div className="mb-24">
        <h2 className="text-3xl font-extrabold text-center mb-12 tracking-tight text-gray-900">
          {t("options.title")}
        </h2>

        <Tabs defaultValue="products" className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-10">
            <TabsList className="grid w-full max-w-md h-auto p-1 bg-muted/50 rounded-2xl grid-cols-3 gap-1">
              <TabsTrigger
                value="products"
                className="rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                {t("options.tabs.products")}
              </TabsTrigger>
              <TabsTrigger
                value="pix"
                className="rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                {t("options.tabs.pix")}
              </TabsTrigger>
              <TabsTrigger
                value="vaquinha"
                className="rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                {t("options.tabs.crowdfunding")}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="products" className="space-y-4 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="rounded-3xl border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <CardHeader className="pb-4">
                  <div className="bg-orange-50 w-10 h-10 rounded-lg flex items-center justify-center mb-2">
                    <Coffee className="h-5 w-5 text-orange-600" />
                  </div>
                  <CardTitle className="text-xl">
                    {t("products.coffee.title")}
                  </CardTitle>
                  <CardDescription>
                    {t("products.coffee.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-4xl font-extrabold text-gray-900 mb-2">
                    {t("products.coffee.price")}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("products.coffee.info")}
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button className="w-full rounded-xl h-12 font-bold">
                    {t("products.coffee.button")}
                  </Button>
                </CardFooter>
              </Card>

              <Card className="rounded-3xl border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <CardHeader className="pb-4">
                  <div className="bg-blue-50 w-10 h-10 rounded-lg flex items-center justify-center mb-2">
                    <Gift className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">
                    {t("products.kit.title")}
                  </CardTitle>
                  <CardDescription>
                    {t("products.kit.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-4xl font-extrabold text-gray-900 mb-2">
                    {t("products.kit.price")}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("products.kit.info")}
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button className="w-full rounded-xl h-12 font-bold">
                    {t("products.kit.button")}
                  </Button>
                </CardFooter>
              </Card>

              <Card className="rounded-3xl border-primary bg-primary text-primary-foreground shadow-xl shadow-primary/20 overflow-hidden flex flex-col relative scale-105 z-10">
                <div className="absolute top-0 right-0 p-4">
                  <Badge className="bg-white/20 text-white border-none backdrop-blur-md">
                    {t("products.supporter.badge")}
                  </Badge>
                </div>
                <CardHeader className="pb-4">
                  <div className="bg-white/10 w-10 h-10 rounded-lg flex items-center justify-center mb-2 backdrop-blur-md">
                    <Heart className="h-5 w-5 text-white fill-white" />
                  </div>
                  <CardTitle className="text-xl text-white">
                    {t("products.supporter.title")}
                  </CardTitle>
                  <CardDescription className="text-primary-50/80">
                    {t("products.supporter.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-4xl font-extrabold text-white mb-2">
                    {t("products.supporter.price")}
                  </div>
                  <p className="text-sm text-primary-50/70">
                    {t("products.supporter.info")}
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button className="w-full rounded-xl h-12 font-bold bg-white text-primary hover:bg-white/90 shadow-2xl">
                    {t("products.supporter.button")}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className="text-center mt-12 text-sm text-muted-foreground italic">
              <p>{t("products.disclaimer")}</p>
            </div>
          </TabsContent>

          <TabsContent value="pix" className="space-y-4">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>{t("pix.title")}</CardTitle>
                <CardDescription>{t("pix.description")}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-lg mb-4 border">
                  <Image
                    src="/placeholder.svg?height=200&width=200"
                    alt="QR Code PIX"
                    width={200}
                    height={200}
                    className="mx-auto"
                  />
                </div>

                <div className="flex items-center gap-2 p-3 bg-muted rounded-md w-full max-w-xs mb-4">
                  <code className="text-sm flex-1 overflow-hidden text-ellipsis">
                    email@exemplo.com
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={copyPixKey}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">{t("pix.copyButton")}</span>
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground text-center max-w-md">
                  {t("pix.instructions")}
                  <a
                    href="mailto:contato@menvo.com"
                    className="text-primary ml-1"
                  >
                    contato@menvo.com
                  </a>
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vaquinha" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("crowdfunding.title")}</CardTitle>
                <CardDescription>
                  {t("crowdfunding.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted rounded-lg p-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">
                      {t("crowdfunding.goal", { amount: "5.000" })}
                    </span>
                    <span className="text-sm font-medium">65%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full">
                    <div className="bg-primary h-2 rounded-full w-[65%]"></div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  {t("crowdfunding.info")}
                </p>

                <Button className="w-full" asChild>
                  <Link
                    href="https://www.vakinha.com.br"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("crowdfunding.button")}{" "}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
            <Link href="#doar">
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
