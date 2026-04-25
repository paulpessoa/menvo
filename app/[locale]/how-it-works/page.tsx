"use client"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  HandHeart,
  Mail,
  MessageSquare,
  Search,
  Shield,
  TrendingUp,
  User,
  Users,
  Video
} from "lucide-react"
import { useTranslations } from "next-intl"

export default function HowItWorksPage() {
  const t = useTranslations()

  return (
    <div className="container max-w-7xl mx-auto px-4 py-12 md:py-20">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-4 mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
          {t("howItWorks.title")}
        </h1>
        <p className="text-muted-foreground max-w-[700px] text-lg md:text-xl leading-relaxed">
          {t("howItWorks.description")}
        </p>
      </div>

      <Tabs defaultValue="mentees" className="w-full max-w-5xl mx-auto">
        <div className="flex justify-center mb-12">
          <TabsList className="grid w-full h-auto p-1 bg-muted/50 rounded-2xl grid-cols-2 md:grid-cols-4 gap-1">
            <TabsTrigger value="mentees" className="rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-sm font-bold">
              {t("howItWorks.forMentees")}
            </TabsTrigger>
            <TabsTrigger value="mentors" className="rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-sm font-bold">
              {t("howItWorks.forMentors")}
            </TabsTrigger>
            <TabsTrigger value="ngos" className="rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-sm font-bold">
              {t("howItWorks.forNGOs")}
            </TabsTrigger>
            <TabsTrigger value="companies" className="rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-sm font-bold">
              {t("howItWorks.forCompanies")}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* --- MENTEES --- */}
        <TabsContent value="mentees" className="space-y-16 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-white p-8 rounded-3xl border border-gray-50 shadow-sm">
            <div className="space-y-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transform -rotate-3">
                <User className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                    {t("howItWorks.mentees.step1.title")}
                </h2>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    {t("howItWorks.mentees.step1.description")}
                </p>
              </div>
              <ul className="space-y-3">
                {[1, 2, 3].map(i => (
                   <li key={i} className="flex items-center gap-3">
                    <div className="bg-primary/10 p-1 rounded-full">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-gray-700">{t(`howItWorks.mentees.step1.feature${i}`)}</span>
                   </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center relative">
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
              <Image src="/images/how-it-works/register-mentee.jpg" width={450} height={350} alt="Mentee Step 1" className="rounded-2xl object-cover shadow-2xl relative z-10 ring-4 ring-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center md:order-last relative">
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
              <Image src="/images/how-it-works/find.jpg" width={450} height={350} alt="Mentee Step 2" className="rounded-2xl object-cover shadow-2xl relative z-10 ring-4 ring-white" />
            </div>
            <div className="space-y-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transform rotate-3">
                <Search className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                    {t("howItWorks.mentees.step2.title")}
                </h2>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    {t("howItWorks.mentees.step2.description")}
                </p>
              </div>
              <ul className="space-y-3">
                {[1, 2, 3].map(i => (
                   <li key={i} className="flex items-center gap-3">
                    <div className="bg-primary/10 p-1 rounded-full">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-gray-700">{t(`howItWorks.mentees.step2.feature${i}`)}</span>
                   </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-white p-8 rounded-3xl border border-gray-50 shadow-sm">
            <div className="space-y-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transform -rotate-3">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                    {t("howItWorks.mentees.step3.title")}
                </h2>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    {t("howItWorks.mentees.step3.description")}
                </p>
              </div>
              <ul className="space-y-3">
                {[1, 2, 3].map(i => (
                   <li key={i} className="flex items-center gap-3">
                    <div className="bg-primary/10 p-1 rounded-full">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-gray-700">{t(`howItWorks.mentees.step3.feature${i}`)}</span>
                   </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center relative">
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
              <Image src="/images/how-it-works/schedule.jpg" width={450} height={350} alt="Mentee Step 3" className="rounded-2xl object-cover shadow-2xl relative z-10 ring-4 ring-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center md:order-last relative">
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
              <Image src="/images/how-it-works/grow-together.jpg" width={450} height={350} alt="Mentee Step 4" className="rounded-2xl object-cover shadow-2xl relative z-10 ring-4 ring-white" />
            </div>
            <div className="space-y-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transform rotate-3">
                <Video className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                    {t("howItWorks.mentees.step4.title")}
                </h2>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    {t("howItWorks.mentees.step4.description")}
                </p>
              </div>
              <ul className="space-y-3">
                {[1, 2, 3].map(i => (
                   <li key={i} className="flex items-center gap-3">
                    <div className="bg-primary/10 p-1 rounded-full">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-gray-700">{t(`howItWorks.mentees.step4.feature${i}`)}</span>
                   </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex justify-center pt-8">
            <Button size="lg" asChild className="px-10 h-14 rounded-xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
              <Link href="/signup">{t("howItWorks.mentees.getStarted")}</Link>
            </Button>
          </div>
        </TabsContent>

        {/* --- MENTORS --- */}
        <TabsContent value="mentors" className="space-y-16 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-white p-8 rounded-3xl border border-gray-50 shadow-sm">
            <div className="space-y-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transform -rotate-3">
                <User className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                    {t("howItWorks.mentors.step1.title")}
                </h2>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    {t("howItWorks.mentors.step1.description")}
                </p>
              </div>
              <ul className="space-y-3">
                {[1, 2, 3].map(i => (
                   <li key={i} className="flex items-center gap-3">
                    <div className="bg-primary/10 p-1 rounded-full">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-gray-700">{t(`howItWorks.mentors.step1.feature${i}`)}</span>
                   </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center relative">
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
              <Image src="/images/how-it-works/register-mentor.jpg" width={450} height={350} alt="Mentor Step 1" className="rounded-2xl object-cover shadow-2xl relative z-10 ring-4 ring-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center md:order-last relative">
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
              <Image src="/images/how-it-works/verify.jpg" width={450} height={350} alt="Mentor Step 2" className="rounded-2xl object-cover shadow-2xl relative z-10 ring-4 ring-white" />
            </div>
            <div className="space-y-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transform rotate-3">
                <Shield className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                    {t("howItWorks.mentors.step2.title")}
                </h2>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    {t("howItWorks.mentors.step2.description")}
                </p>
              </div>
              <ul className="space-y-3">
                {[1, 2, 3].map(i => (
                   <li key={i} className="flex items-center gap-3">
                    <div className="bg-primary/10 p-1 rounded-full">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-gray-700">{t(`howItWorks.mentors.step2.feature${i}`)}</span>
                   </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-white p-8 rounded-3xl border border-gray-50 shadow-sm">
            <div className="space-y-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transform -rotate-3">
                <Clock className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                    {t("howItWorks.mentors.step3.title")}
                </h2>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    {t("howItWorks.mentors.step3.description")}
                </p>
              </div>
              <ul className="space-y-3">
                {[1, 2, 3].map(i => (
                   <li key={i} className="flex items-center gap-3">
                    <div className="bg-primary/10 p-1 rounded-full">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-gray-700">{t(`howItWorks.mentors.step3.feature${i}`)}</span>
                   </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center relative">
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
              <Image src="/images/how-it-works/availability.jpg" width={450} height={350} alt="Mentor Step 3" className="rounded-2xl object-cover shadow-2xl relative z-10 ring-4 ring-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center md:order-last relative">
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
              <Image src="/images/how-it-works/conduct.jpg" width={450} height={350} alt="Mentor Step 4" className="rounded-2xl object-cover shadow-2xl relative z-10 ring-4 ring-white" />
            </div>
            <div className="space-y-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transform rotate-3">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                    {t("howItWorks.mentors.step4.title")}
                </h2>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    {t("howItWorks.mentors.step4.description")}
                </p>
              </div>
              <ul className="space-y-3">
                {[1, 2, 3].map(i => (
                   <li key={i} className="flex items-center gap-3">
                    <div className="bg-primary/10 p-1 rounded-full">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-gray-700">{t(`howItWorks.mentors.step4.feature${i}`)}</span>
                   </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex justify-center pt-8">
            <Button size="lg" asChild className="px-10 h-14 rounded-xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
              <Link href="/signup">{t("howItWorks.mentors.becomeMentor")}</Link>
            </Button>
          </div>
        </TabsContent>

        {/* --- NGOS --- */}
        <TabsContent value="ngos" className="space-y-16 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-white p-8 rounded-3xl border border-gray-50 shadow-sm">
            <div className="space-y-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transform -rotate-3">
                <HandHeart className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                    {t("howItWorks.ngos.step1.title")}
                </h2>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    {t("howItWorks.ngos.step1.description")}
                </p>
              </div>
              <ul className="space-y-3">
                {[1, 2, 3].map(i => (
                   <li key={i} className="flex items-center gap-3">
                    <div className="bg-primary/10 p-1 rounded-full">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-gray-700">{t(`howItWorks.ngos.step1.feature${i}`)}</span>
                   </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center relative">
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
              <Image src="/images/how-it-works/ngo-register.jpg" width={450} height={350} alt="NGO Step 1" className="rounded-2xl object-cover shadow-2xl relative z-10 ring-4 ring-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center md:order-last relative">
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
              <Image src="/images/how-it-works/ngo-connect.jpg" width={450} height={350} alt="NGO Step 2" className="rounded-2xl object-cover shadow-2xl relative z-10 ring-4 ring-white" />
            </div>
            <div className="space-y-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transform rotate-3">
                <Users className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                    {t("howItWorks.ngos.step2.title")}
                </h2>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    {t("howItWorks.ngos.step2.description")}
                </p>
              </div>
              <ul className="space-y-3">
                {[1, 2, 3].map(i => (
                   <li key={i} className="flex items-center gap-3">
                    <div className="bg-primary/10 p-1 rounded-full">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-gray-700">{t(`howItWorks.ngos.step2.feature${i}`)}</span>
                   </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex justify-center pt-8">
            <Button size="lg" asChild className="px-10 h-14 rounded-xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
              <Link href="/signup">{t("howItWorks.ngos.getStarted")}</Link>
            </Button>
          </div>
        </TabsContent>

        {/* --- COMPANIES --- */}
        <TabsContent value="companies" className="space-y-16 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-white p-8 rounded-3xl border border-gray-50 shadow-sm">
            <div className="space-y-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transform -rotate-3">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                    {t("howItWorks.companies.step1.title")}
                </h2>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    {t("howItWorks.companies.step1.description")}
                </p>
              </div>
              <ul className="space-y-3">
                {[1, 2, 3].map(i => (
                   <li key={i} className="flex items-center gap-3">
                    <div className="bg-primary/10 p-1 rounded-full">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-gray-700">{t(`howItWorks.companies.step1.feature${i}`)}</span>
                   </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center relative">
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
              <Image src="/images/how-it-works/company-volunteer.jpg" width={450} height={350} alt="Company Step 1" className="rounded-2xl object-cover shadow-2xl relative z-10 ring-4 ring-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center md:order-last relative">
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
              <Image src="/images/how-it-works/company-esg.jpg" width={450} height={350} alt="Company Step 2" className="rounded-2xl object-cover shadow-2xl relative z-10 ring-4 ring-white" />
            </div>
            <div className="space-y-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transform rotate-3">
                <FileText className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                    {t("howItWorks.companies.step2.title")}
                </h2>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    {t("howItWorks.companies.step2.description")}
                </p>
              </div>
              <ul className="space-y-3">
                {[1, 2, 3].map(i => (
                   <li key={i} className="flex items-center gap-3">
                    <div className="bg-primary/10 p-1 rounded-full">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-gray-700">{t(`howItWorks.companies.step2.feature${i}`)}</span>
                   </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-white p-8 rounded-3xl border border-gray-50 shadow-sm">
            <div className="space-y-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transform -rotate-3">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                    {t("howItWorks.companies.step3.title")}
                </h2>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    {t("howItWorks.companies.step3.description")}
                </p>
              </div>
              <ul className="space-y-3">
                {[1, 2, 3].map(i => (
                   <li key={i} className="flex items-center gap-3">
                    <div className="bg-primary/10 p-1 rounded-full">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-gray-700">{t(`howItWorks.companies.step3.feature${i}`)}</span>
                   </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center relative">
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
              <Image src="/images/how-it-works/company-benefits.jpg" width={450} height={350} alt="Company Step 3" className="rounded-2xl object-cover shadow-2xl relative z-10 ring-4 ring-white" />
            </div>
          </div>

          <div className="flex justify-center pt-8">
            <Button size="lg" asChild className="px-10 h-14 rounded-xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
              <Link href="/signup">{t("howItWorks.companies.getStarted")}</Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-24 max-w-4xl mx-auto text-center border-t pt-16">
        <h2 className="text-3xl font-extrabold mb-4 text-gray-900">{t("howItWorks.faq.title")}</h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
          {t("howItWorks.faq.description")}
        </p>
        <Button size="lg" variant="outline" asChild className="rounded-xl px-8 font-bold border-2">
          <Link href="/faq">{t("howItWorks.faq.viewAll")}</Link>
        </Button>
      </div>
    </div>
  )
}
