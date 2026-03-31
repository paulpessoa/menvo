"use client"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Calendar, CheckCircle2, Clock, FileText, HandHeart, Mail, MessageSquare, Search, Shield, TrendingUp, User, Users, Video } from "lucide-react"
import { useTranslation } from "react-i18next"

export default function HowItWorksPage() {
  const { t } = useTranslation()

  return (
    <div className="container py-8 md:py-12">
      <div className="flex flex-col items-center text-center space-y-4 mb-12">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">{t("howItWorks.title")}</h1>
        <p className="text-muted-foreground max-w-[800px] md:text-xl">
          {t("howItWorks.description")}
        </p>
      </div>

      <Tabs defaultValue="mentees" className="w-full max-w-4xl mx-auto">
        <div className="flex justify-center mb-8">
          <TabsList className="grid w-full max-w-4xl grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="mentees">{t("howItWorks.forMentees")}</TabsTrigger>
            <TabsTrigger value="mentors">{t("howItWorks.forMentors")}</TabsTrigger>
            <TabsTrigger value="ngos">{t("howItWorks.forNGOs")}</TabsTrigger>
            <TabsTrigger value="companies">{t("howItWorks.forCompanies")}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="mentees" className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold">{t("howItWorks.mentees.step1.title")}</h2>
              <p className="text-muted-foreground">
                {t("howItWorks.mentees.step1.description")}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.mentees.step1.feature1")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.mentees.step1.feature2")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.mentees.step1.feature3")}</span>
                </li>
              </ul>
            </div>
            <div className="flex justify-center">
              <Image
                src="/images/how-it-works/register-mentee.jpg"
                width={400}
                height={300}
                alt="Create profile illustration"
                className="rounded-lg object-cover"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center md:order-last">
            <div className="flex justify-center md:order-last">
              <Image
                src="/images/how-it-works/find.jpg"
                width={400}
                height={300}
                alt="Find mentors illustration"
                className="rounded-lg object-cover"
              />
            </div>
            <div className="space-y-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Search className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold">{t("howItWorks.mentees.step2.title")}</h2>
              <p className="text-muted-foreground">
                {t("howItWorks.mentees.step2.description")}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.mentees.step2.feature1")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.mentees.step2.feature2")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.mentees.step2.feature3")}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Calendar className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold">{t("howItWorks.mentees.step3.title")}</h2>
              <p className="text-muted-foreground">
                {t("howItWorks.mentees.step3.description")}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.mentees.step3.feature1")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.mentees.step3.feature2")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.mentees.step3.feature3")}</span>
                </li>
              </ul>
            </div>
            <div className="flex justify-center">
              <Image
                src="/images/how-it-works/schedule.jpg"
                width={400}
                height={300}
                alt="Schedule session illustration"
                className="rounded-lg object-cover"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center md:order-last">
            <div className="flex justify-center md:order-last">
              <Image
                src="/images/how-it-works/grow-together.jpg"
                width={400}
                height={300}
                alt="Connect and grow illustration"
                className="rounded-lg object-cover"
              />
            </div>
            <div className="space-y-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Video className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold">{t("howItWorks.mentees.step4.title")}</h2>
              <p className="text-muted-foreground">
                {t("howItWorks.mentees.step4.description")}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.mentees.step4.feature1")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.mentees.step4.feature2")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.mentees.step4.feature3")}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">{t("howItWorks.mentees.getStarted")}</Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="mentors" className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold">{t("howItWorks.mentors.step1.title")}</h2>
              <p className="text-muted-foreground">
                {t("howItWorks.mentors.step1.description")}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.mentors.step1.feature1")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.mentors.step1.feature2")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.mentors.step1.feature3")}</span>
                </li>
              </ul>
            </div>
            <div className="flex justify-center">
              <Image
                src="/images/how-it-works/register-mentor.jpg"
                width={400}
                height={300}
                alt="Mentor profile illustration"
                className="rounded-lg object-cover"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center md:order-last">
            <div className="flex justify-center md:order-last">
              <Image
                src="/images/how-it-works/verify.jpg"
                width={400}
                height={300}
                alt="Verification illustration"
                className="rounded-lg object-cover"
              />
            </div>
            <div className="space-y-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold">{t("howItWorks.mentors.step2.title")}</h2>
              <p className="text-muted-foreground">
                {t("howItWorks.mentors.step2.description")}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.mentors.step2.feature1")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.mentors.step2.feature2")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.mentors.step2.feature3")}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold">{t("howItWorks.mentors.step3.title")}</h2>
              <p className="text-muted-foreground">
                {t("howItWorks.mentors.step3.description")}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.mentors.step3.feature1")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.mentors.step3.feature2")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.mentors.step3.feature3")}</span>
                </li>
              </ul>
            </div>
            <div className="flex justify-center">
              <Image
                src="/images/how-it-works/availability.jpg"
                width={400}
                height={300}
                alt="Set availability illustration"
                className="rounded-lg object-cover"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center md:order-last">
            <div className="flex justify-center md:order-last">
              <Image
                src="/images/how-it-works/conduct.jpg"
                width={400}
                height={300}
                alt="Mentor sessions illustration"
                className="rounded-lg object-cover"
              />
            </div>
            <div className="space-y-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold">{t("howItWorks.mentors.step4.title")}</h2>
              <p className="text-muted-foreground">
                {t("howItWorks.mentors.step4.description")}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.mentors.step4.feature1")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.mentors.step4.feature2")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.mentors.step4.feature3")}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">{t("howItWorks.mentors.becomeMentor")}</Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="ngos" className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <HandHeart className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold">{t("howItWorks.ngos.step1.title")}</h2>
              <p className="text-muted-foreground">
                {t("howItWorks.ngos.step1.description")}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.ngos.step1.feature1")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.ngos.step1.feature2")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.ngos.step1.feature3")}</span>
                </li>
              </ul>
            </div>
            <div className="flex justify-center">
              <Image
                src="/images/how-it-works/ngo-register.jpg"
                width={400}
                height={300}
                alt="NGO registration illustration"
                className="rounded-lg object-cover"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center md:order-last">
            <div className="flex justify-center md:order-last">
              <Image
                src="/images/how-it-works/ngo-connect.jpg"
                width={400}
                height={300}
                alt="Connect youth with mentors illustration"
                className="rounded-lg object-cover"
              />
            </div>
            <div className="space-y-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold">{t("howItWorks.ngos.step2.title")}</h2>
              <p className="text-muted-foreground">
                {t("howItWorks.ngos.step2.description")}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.ngos.step2.feature1")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.ngos.step2.feature2")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.ngos.step2.feature3")}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">{t("howItWorks.ngos.getStarted")}</Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="companies" className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold">{t("howItWorks.companies.step1.title")}</h2>
              <p className="text-muted-foreground">
                {t("howItWorks.companies.step1.description")}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.companies.step1.feature1")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.companies.step1.feature2")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.companies.step1.feature3")}</span>
                </li>
              </ul>
            </div>
            <div className="flex justify-center">
              <Image
                src="/images/how-it-works/company-volunteer.jpg"
                width={400}
                height={300}
                alt="Corporate volunteering illustration"
                className="rounded-lg object-cover"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center md:order-last">
            <div className="flex justify-center md:order-last">
              <Image
                src="/images/how-it-works/company-esg.jpg"
                width={400}
                height={300}
                alt="ESG reports illustration"
                className="rounded-lg object-cover"
              />
            </div>
            <div className="space-y-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold">{t("howItWorks.companies.step2.title")}</h2>
              <p className="text-muted-foreground">
                {t("howItWorks.companies.step2.description")}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.companies.step2.feature1")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.companies.step2.feature2")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.companies.step2.feature3")}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold">{t("howItWorks.companies.step3.title")}</h2>
              <p className="text-muted-foreground">
                {t("howItWorks.companies.step3.description")}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.companies.step3.feature1")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.companies.step3.feature2")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{t("howItWorks.companies.step3.feature3")}</span>
                </li>
              </ul>
            </div>
            <div className="flex justify-center">
              <Image
                src="/images/how-it-works/company-benefits.jpg"
                width={400}
                height={300}
                alt="Company benefits illustration"
                className="rounded-lg object-cover"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">{t("howItWorks.companies.getStarted")}</Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-20 max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">{t("howItWorks.faq.title")}</h2>
        <p className="text-muted-foreground mb-6">
          {t("howItWorks.faq.description")}
        </p>
        <Button size="lg" asChild>
          <Link href="/faq">{t("howItWorks.faq.viewAll")}</Link>
        </Button>
      </div>


    </div>
  )
}
