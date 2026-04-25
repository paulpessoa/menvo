"use client"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Globe, Heart, Users, Map } from "lucide-react"
import { useTranslations } from "next-intl"
import { Partners } from "@/components/Partners"

export default function AboutPage() {
  const t = useTranslations()

  return (
    <div className="container max-w-7xl mx-auto px-4 py-12 md:py-20">
      <div className="flex flex-col items-center text-center space-y-6 mb-16">
        <Badge variant="secondary" className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border-none">
          {t("about.badge")}
        </Badge>
        <h1
          id="mission"
          className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900"
        >
          {t("about.ourMission.title")}
        </h1>
        <p className="text-muted-foreground max-w-[700px] text-lg md:text-xl leading-relaxed">
          {t("about.ourMission.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center mb-24">
        <div className="space-y-6 text-center md:text-left">
          <h2 className="text-3xl font-extrabold text-gray-900">
            {t("about.whyWeStarted.title")}
          </h2>
          <div className="space-y-4 text-muted-foreground text-base md:text-lg leading-relaxed">
            <p>{t("about.whyWeStarted.paragraph1")}</p>
            <p>{t("about.whyWeStarted.paragraph2")}</p>
            <p>{t("about.whyWeStarted.paragraph3")}</p>
          </div>
        </div>
        <div className="flex justify-center relative">
          <div className="absolute -inset-4 bg-primary/5 rounded-full blur-3xl" />
          <Image
            src="/images/about/hackathon-latinoware-paul-ismaela-italo.jpg"
            width={550}
            height={450}
            alt={t("about.ourStoryImageAlt")}
            className="rounded-3xl object-cover shadow-2xl relative z-10 ring-4 ring-white"
          />
        </div>
      </div>

      <div className="bg-muted/30 rounded-[2.5rem] p-8 md:p-16 mb-24 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-white border-none shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center transform -rotate-3">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {t("about.values.community.title")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("about.values.community.description")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center transform rotate-3">
                <Heart className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {t("about.values.accessibility.title")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("about.values.accessibility.description")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center transform -rotate-3">
                <Globe className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {t("about.values.impact.title")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("about.values.impact.description")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mb-24">
        <h2 id="sdg" className="text-3xl font-extrabold text-center mb-4 text-gray-900">
          {t("about.sdg.title")}
        </h2>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12 text-lg">
          {t("about.sdg.description")}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            {
              number: 4,
              title: t("about.sdg.goals.qualityEducation"),
              color: "bg-red-50 text-red-900 border-red-100",
              id: "sdg4"
            },
            {
              number: 5,
              title: t("about.sdg.goals.genderEquality"),
              color: "bg-orange-50 text-orange-900 border-orange-100",
              id: "sdg5"
            },
            {
              number: 8,
              title: t("about.sdg.goals.decentWork"),
              color: "bg-green-50 text-green-900 border-green-100",
              id: "sdg8"
            },
            {
              number: 10,
              title: t("about.sdg.goals.reducedInequalities"),
              color: "bg-blue-50 text-blue-900 border-blue-100",
              id: "sdg10"
            }
          ].map((goal) => (
            <div
              key={goal.number}
              id={goal.id}
              className={`p-6 rounded-3xl border ${goal.color} flex flex-col items-center text-center space-y-2 hover:scale-105 transition-transform`}
            >
              <div className="font-black text-2xl">
                #{goal.number}
              </div>
              <div className="text-xs font-bold uppercase tracking-tight leading-tight">{goal.title}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center mb-24">
        <div className="flex justify-center order-last md:order-first relative">
          <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl" />
          <Image
            src="/images/about/menvo-team.png"
            width={550}
            height={450}
            alt={t("about.ourStoryImageAlt")}
            className="rounded-3xl object-cover shadow-2xl relative z-10 ring-4 ring-white"
          />
        </div>
        <div className="space-y-6 text-center md:text-left">
          <h2 id="team" className="text-3xl font-extrabold text-gray-900 scroll-mt-20">
            {t("about.ourTeam.title")}
          </h2>
          <div className="space-y-4 text-muted-foreground text-base md:text-lg leading-relaxed">
            <p>{t("about.ourTeam.paragraph1")}</p>
            <p>{t("about.ourTeam.paragraph2")}</p>
            <p>{t("about.ourTeam.paragraph3")}</p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-4">
              <Button size="lg" asChild className="rounded-xl font-bold shadow-lg shadow-primary/10">
                <Link
                  href="https://wa.me/5581995097377?text=Olá!%20Vi%20o%20projeto%20e%20me%20interessei%20bastante.%20Gostaria%20de%20ajudar%20com%20algo%20se%20for%20possível..."
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("about.ourTeam.joinTeam")}
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-xl font-bold border-2">
                <Link href="/maps">
                  <Map className="mr-2 h-5 w-5" />
                  {t("about.ourTeam.viewMap")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mb-24" id="partners">
        <Partners />
      </div>

      <div className="bg-secondary/50 rounded-[2.5rem] p-10 md:p-20 text-center border border-gray-100 mb-12">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">
          {t("about.joinOurMission.title")}
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          {t("about.joinOurMission.description")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild className="rounded-xl font-bold px-10 h-14 shadow-xl shadow-primary/10">
            <Link href="/signup">{t("about.joinOurMission.signUpNow")}</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="rounded-xl font-bold px-10 h-14 border-2">
            <Link href="/contact">{t("about.joinOurMission.contactUs")}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
