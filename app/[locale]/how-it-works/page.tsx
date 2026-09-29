"use client"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StepSection } from "@/components/how-it-works/StepSection"
import {
  BarChart3,
  Building2,
  Calendar,
  Clock,
  MessageSquare,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  User,
  Users,
  Video,
  Loader2
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useAuth } from "@/lib/auth"

export default function HowItWorksPage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-7xl mx-auto px-4 py-12 flex justify-center min-h-[60vh] items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <HowItWorksContent />
    </Suspense>
  )
}

const VALID_TABS = ["mentees", "mentors", "organizations"]
// Old links (footer, bookmarks) used separate ngos/companies tabs before the
// two were merged into a single "organizations" audience — keep them working.
const TAB_ALIASES: Record<string, string> = { ngos: "organizations", companies: "organizations" }

function HowItWorksContent() {
  const t = useTranslations()
  const { isMentor } = useAuth()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const resolvedTabParam = tabParam ? TAB_ALIASES[tabParam] || tabParam : null
  const defaultTab = isMentor ? "mentors" : "mentees"
  const [activeTab, setActiveTab] = useState(
    resolvedTabParam && VALID_TABS.includes(resolvedTabParam) ? resolvedTabParam : defaultTab
  )

  useEffect(() => {
    if (resolvedTabParam && VALID_TABS.includes(resolvedTabParam)) {
      setActiveTab(resolvedTabParam)
    }
  }, [resolvedTabParam])

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-4 mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
          {t("howItWorks.title")}
        </h1>
        <p className="text-muted-foreground max-w-[700px] text-lg md:text-xl leading-relaxed">
          {t("howItWorks.description")}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-5xl mx-auto">
        <div className="flex justify-center mb-12">
          <TabsList className="grid w-full h-auto p-1 bg-muted/50 rounded-2xl grid-cols-1 sm:grid-cols-3 gap-1">
            <TabsTrigger value="mentees" className="rounded-xl py-3 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm text-sm font-bold">
              {t("howItWorks.forMentees")}
            </TabsTrigger>
            <TabsTrigger value="mentors" className="rounded-xl py-3 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm text-sm font-bold">
              {t("howItWorks.forMentors")}
            </TabsTrigger>
            <TabsTrigger value="organizations" className="rounded-xl py-3 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm text-sm font-bold">
              {t("howItWorks.forOrganizations")}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* --- MENTEES --- */}
        <TabsContent value="mentees">
          <StepSection
            section="mentees"
            steps={[1, 2, 3, 4, 5]}
            icons={{
              1: <User className="h-6 w-6" />,
              2: <Sparkles className="h-6 w-6" />,
              3: <Search className="h-6 w-6" />,
              4: <Calendar className="h-6 w-6" />,
              5: <Video className="h-6 w-6" />
            }}
            images={{
              1: "register-mentee.jpg",
              2: "grow.jpg",
              3: "find.jpg",
              4: "schedule.jpg",
              5: "grow-together.jpg"
            }}
            rotate="-rotate-3"
            ctaKey="getStarted"
            ctaHref="/signup"
          />
        </TabsContent>

        {/* --- MENTORS --- */}
        <TabsContent value="mentors">
          <StepSection
            section="mentors"
            steps={[1, 2, 3, 4]}
            icons={{
              1: <User className="h-6 w-6" />,
              2: <Shield className="h-6 w-6" />,
              3: <Clock className="h-6 w-6" />,
              4: <MessageSquare className="h-6 w-6" />
            }}
            images={{
              1: "register-mentor.jpg",
              2: "verify.jpg",
              3: "availability.jpg",
              4: "conduct.jpg"
            }}
            rotate="rotate-3"
            ctaKey="becomeMentor"
            ctaHref={isMentor ? "/profile?tab=mentorship" : "/signup"}
          />
        </TabsContent>

        {/* --- ORGANIZATIONS (NGOs + companies, same model) --- */}
        <TabsContent value="organizations">
          <StepSection
            section="organizations"
            steps={[1, 2, 3, 4]}
            icons={{
              1: <Building2 className="h-6 w-6" />,
              2: <Users className="h-6 w-6" />,
              3: <TrendingUp className="h-6 w-6" />,
              4: <BarChart3 className="h-6 w-6" />
            }}
            images={{
              1: "ngo-register.jpg",
              2: "ngo-connect.jpg",
              3: "company-volunteer.jpg",
              4: "company-esg.jpg"
            }}
            rotate="-rotate-3"
            ctaKey="getStarted"
            ctaHref={"/contact?tipo=organizacao#organizacao" as any}
          />
        </TabsContent>
      </Tabs>

      <div className="mt-24 max-w-4xl mx-auto text-center border-t border-border pt-16">
        <h2 className="text-3xl font-extrabold mb-4 text-foreground">{t("howItWorks.faq.title")}</h2>
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
