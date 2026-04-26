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
  Video,
  BarChart3,
  Rocket
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
          {[1, 2, 3, 4].map(step => (
            <div key={step} className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center ${step % 2 === 0 ? '' : 'bg-white p-8 rounded-3xl border border-gray-50 shadow-sm'}`}>
              <div className={`space-y-6 ${step % 2 === 0 ? 'md:order-last' : ''}`}>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transform -rotate-3">
                  {step === 1 && <User className="h-6 w-6" />}
                  {step === 2 && <Search className="h-6 w-6" />}
                  {step === 3 && <Calendar className="h-6 w-6" />}
                  {step === 4 && <Video className="h-6 w-6" />}
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">{t(`howItWorks.mentees.step${step}.title`)}</h2>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{t(`howItWorks.mentees.step${step}.description`)}</p>
                </div>
                <ul className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="bg-primary/10 p-1 rounded-full"><CheckCircle2 className="h-4 w-4 text-primary" /></div>
                      <span className="font-medium text-gray-700">{t(`howItWorks.mentees.step${step}.feature${i}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-center relative">
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
                <Image 
                  src={`/images/how-it-works/${step === 1 ? 'register-mentee.jpg' : step === 2 ? 'find.jpg' : step === 3 ? 'schedule.jpg' : 'grow-together.jpg'}`} 
                  width={450} height={350} alt={`Mentee Step ${step}`} 
                  className="rounded-2xl object-cover shadow-2xl relative z-10 ring-4 ring-white" 
                />
              </div>
            </div>
          ))}
          <div className="flex justify-center pt-8">
            <Button size="lg" asChild className="px-10 h-14 rounded-xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
              <Link href="/signup">{t("howItWorks.mentees.getStarted")}</Link>
            </Button>
          </div>
        </TabsContent>

        {/* --- MENTORS --- */}
        <TabsContent value="mentors" className="space-y-16 outline-none">
          {[1, 2, 3, 4].map(step => (
            <div key={step} className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center ${step % 2 === 0 ? '' : 'bg-white p-8 rounded-3xl border border-gray-50 shadow-sm'}`}>
              <div className={`space-y-6 ${step % 2 === 0 ? 'md:order-last' : ''}`}>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transform rotate-3">
                  {step === 1 && <User className="h-6 w-6" />}
                  {step === 2 && <Shield className="h-6 w-6" />}
                  {step === 3 && <Clock className="h-6 w-6" />}
                  {step === 4 && <MessageSquare className="h-6 w-6" />}
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">{t(`howItWorks.mentors.step${step}.title`)}</h2>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{t(`howItWorks.mentors.step${step}.description`)}</p>
                </div>
                <ul className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="bg-primary/10 p-1 rounded-full"><CheckCircle2 className="h-4 w-4 text-primary" /></div>
                      <span className="font-medium text-gray-700">{t(`howItWorks.mentors.step${step}.feature${i}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-center relative">
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
                <Image 
                  src={`/images/how-it-works/${step === 1 ? 'register-mentor.jpg' : step === 2 ? 'verify.jpg' : step === 3 ? 'availability.jpg' : 'conduct.jpg'}`} 
                  width={450} height={350} alt={`Mentor Step ${step}`} 
                  className="rounded-2xl object-cover shadow-2xl relative z-10 ring-4 ring-white" 
                />
              </div>
            </div>
          ))}
          <div className="flex justify-center pt-8">
            <Button size="lg" asChild className="px-10 h-14 rounded-xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
              <Link href="/signup">{t("howItWorks.mentors.becomeMentor")}</Link>
            </Button>
          </div>
        </TabsContent>

        {/* --- NGOS --- */}
        <TabsContent value="ngos" className="space-y-16 outline-none">
          {[1, 2, 3, 4].map(step => (
            <div key={step} className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center ${step % 2 === 0 ? '' : 'bg-white p-8 rounded-3xl border border-gray-50 shadow-sm'}`}>
              <div className={`space-y-6 ${step % 2 === 0 ? 'md:order-last' : ''}`}>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transform -rotate-3">
                  {step === 1 && <HandHeart className="h-6 w-6" />}
                  {step === 2 && <Users className="h-6 w-6" />}
                  {step === 3 && <TrendingUp className="h-6 w-6" />}
                  {step === 4 && <BarChart3 className="h-6 w-6" />}
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">{t(`howItWorks.ngos.step${step}.title`)}</h2>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{t(`howItWorks.ngos.step${step}.description`)}</p>
                </div>
                <ul className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="bg-primary/10 p-1 rounded-full"><CheckCircle2 className="h-4 w-4 text-primary" /></div>
                      <span className="font-medium text-gray-700">{t(`howItWorks.ngos.step${step}.feature${i}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-center relative">
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
                <Image 
                  src={`/images/how-it-works/${step === 1 ? 'ngo-register.jpg' : step === 2 ? 'ngo-connect.jpg' : 'find.jpg'}`} 
                  width={450} height={350} alt={`NGO Step ${step}`} 
                  className="rounded-2xl object-cover shadow-2xl relative z-10 ring-4 ring-white" 
                />
              </div>
            </div>
          ))}
          <div className="flex justify-center pt-8">
            <Button size="lg" asChild className="px-10 h-14 rounded-xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
              <Link href="/signup">{t("howItWorks.ngos.getStarted")}</Link>
            </Button>
          </div>
        </TabsContent>

        {/* --- COMPANIES --- */}
        <TabsContent value="companies" className="space-y-16 outline-none">
          {[1, 2, 3, 4].map(step => (
            <div key={step} className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center ${step % 2 === 0 ? '' : 'bg-white p-8 rounded-3xl border border-gray-50 shadow-sm'}`}>
              <div className={`space-y-6 ${step % 2 === 0 ? 'md:order-last' : ''}`}>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transform rotate-3">
                  {step === 1 && <Building2 className="h-6 w-6" />}
                  {step === 2 && <FileText className="h-6 w-6" />}
                  {step === 3 && <TrendingUp className="h-6 w-6" />}
                  {step === 4 && <Rocket className="h-6 w-6" />}
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">{t(`howItWorks.companies.step${step}.title`)}</h2>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{t(`howItWorks.companies.step${step}.description`)}</p>
                </div>
                <ul className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="bg-primary/10 p-1 rounded-full"><CheckCircle2 className="h-4 w-4 text-primary" /></div>
                      <span className="font-medium text-gray-700">{t(`howItWorks.companies.step${step}.feature${i}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-center relative">
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
                <Image 
                  src={`/images/how-it-works/${step === 1 ? 'company-volunteer.jpg' : step === 2 ? 'company-esg.jpg' : step === 3 ? 'company-benefits.jpg' : 'conduct.jpg'}`} 
                  width={450} height={350} alt={`Company Step ${step}`} 
                  className="rounded-2xl object-cover shadow-2xl relative z-10 ring-4 ring-white" 
                />
              </div>
            </div>
          ))}
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
        <Button size="lg" variant="outline" asChild className="rounded-xl px-8 font-bold border-2 hover:bg-muted">
          <Link href="/faq">{t("howItWorks.faq.viewAll")}</Link>
        </Button>
      </div>
    </div>
  )
}
