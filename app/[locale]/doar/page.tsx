"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Heart, Coffee, Gift, BookOpen, Users, Trophy, ArrowRight, ExternalLink, Copy } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

export default function DonatePage() {
  const t = useTranslations("donate")

  const copyPixKey = () => {
    navigator.clipboard.writeText("email@exemplo.com")
    toast.success(t("pix.copySuccess"))
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <Badge variant="outline" className="mb-4">
          <Heart className="h-4 w-4 mr-1 text-rose-500" /> {t("hero.badge")}
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight mb-4">{t("hero.title")}</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t("hero.description")}
        </p>
      </div>

      {/* Impact Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <Card>
          <CardHeader className="text-center">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>{t("impact.mentees.title")}</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>{t("impact.mentees.description")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>{t("impact.sessions.title")}</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>{t("impact.sessions.description")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>{t("impact.volunteer.title")}</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>{t("impact.volunteer.description")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Donation Options */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">{t("options.title")}</h2>

        <Tabs defaultValue="products" className="max-w-3xl mx-auto">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="products">{t("options.tabs.products")}</TabsTrigger>
            <TabsTrigger value="pix">{t("options.tabs.pix")}</TabsTrigger>
            <TabsTrigger value="vaquinha">{t("options.tabs.crowdfunding")}</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Coffee className="h-5 w-5 mr-2" /> {t("products.coffee.title")}
                  </CardTitle>
                  <CardDescription>{t("products.coffee.description")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{t("products.coffee.price")}</div>
                  <p className="text-sm text-muted-foreground">{t("products.coffee.info")}</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">{t("products.coffee.button")}</Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Gift className="h-5 w-5 mr-2" /> {t("products.kit.title")}
                  </CardTitle>
                  <CardDescription>{t("products.kit.description")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{t("products.kit.price")}</div>
                  <p className="text-sm text-muted-foreground">{t("products.kit.info")}</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">{t("products.kit.button")}</Button>
                </CardFooter>
              </Card>

              <Card className="border-primary">
                <CardHeader>
                  <Badge className="w-fit mb-2">{t("products.supporter.badge")}</Badge>
                  <CardTitle className="flex items-center text-lg">
                    <Heart className="h-5 w-5 mr-2 text-rose-500" /> {t("products.supporter.title")}
                  </CardTitle>
                  <CardDescription>{t("products.supporter.description")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{t("products.supporter.price")}</div>
                  <p className="text-sm text-muted-foreground">{t("products.supporter.info")}</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="default">
                    {t("products.supporter.button")}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className="text-center mt-8 text-sm text-muted-foreground">
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
                  <code className="text-sm flex-1 overflow-hidden text-ellipsis">email@exemplo.com</code>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyPixKey}>
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">{t("pix.copyButton")}</span>
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground text-center max-w-md">
                  {t("pix.instructions")}
                  <a href="mailto:contato@menvo.com" className="text-primary ml-1">
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
                <CardDescription>{t("crowdfunding.description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted rounded-lg p-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{t("crowdfunding.goal", { amount: "5.000" })}</span>
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
                  <Link href="https://www.vakinha.com.br" target="_blank" rel="noopener noreferrer">
                    {t("crowdfunding.button")} <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* How We Use Donations */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">{t("usage.title")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="flex gap-4">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">{t("usage.items.mentors.title")}</h3>
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
              <h3 className="text-xl font-semibold mb-2">{t("usage.items.events.title")}</h3>
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
              <h3 className="text-xl font-semibold mb-2">{t("usage.items.education.title")}</h3>
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
              <h3 className="text-xl font-semibold mb-2">{t("usage.items.platform.title")}</h3>
              <p className="text-muted-foreground">
                {t("usage.items.platform.description")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mb-16 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">{t("faq.title")}</h2>

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
