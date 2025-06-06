"use client"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Globe, Heart, Users } from "lucide-react"
import { useTranslation } from "react-i18next"

export default function AboutPage() {
    const { t } = useTranslation()

  return (
      <div className="container py-8 md:py-12">
      <div className="flex flex-col items-center text-center space-y-4 mb-12">
        <Badge variant="outline" className="mb-2">
          {t("about.badge")}
        </Badge>
        <h1 id="mission" className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
          {t("about.ourMission.title")}
        </h1>
        <p className="text-muted-foreground max-w-[800px] md:text-xl">
          {t("about.ourMission.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">{t("about.whyWeStarted.title")}</h2>
          <p className="text-muted-foreground">
            {t("about.whyWeStarted.paragraph1")}
          </p>
          <p className="text-muted-foreground">
            {t("about.whyWeStarted.paragraph2")}
          </p>
          <p className="text-muted-foreground">
            {t("about.whyWeStarted.paragraph3")}
          </p>
        </div>
        <div className="flex justify-center">
          <Image
            src="/placeholder.svg?height=400&width=500&text=Our+Story"
            width={500}
            height={400}
            alt={t("about.ourStoryImageAlt")}
            className="rounded-lg object-cover"
          />
        </div>
      </div>

      <div className="bg-secondary/50 rounded-lg p-8 md:p-12 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-background">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">{t("about.values.community.title")}</h3>
              <p className="text-muted-foreground">
                {t("about.values.community.description")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">{t("about.values.accessibility.title")}</h3>
              <p className="text-muted-foreground">
                {t("about.values.accessibility.description")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">{t("about.values.impact.title")}</h3>
              <p className="text-muted-foreground">
                {t("about.values.impact.description")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mb-16">
        <h2 id="sdg" className="text-2xl font-bold text-center mb-8">{t("about.sdg.title")}</h2>
        <p className="text-muted-foreground text-center max-w-3xl mx-auto mb-8">
          {t("about.sdg.description")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { number: 4, title: t("about.sdg.goals.qualityEducation"), color: "bg-red-100 text-red-800", id: "sdg4" },
            { number: 5, title: t("about.sdg.goals.genderEquality"), color: "bg-orange-100 text-orange-800", id: "sdg5" },
            { number: 8, title: t("about.sdg.goals.decentWork"), color: "bg-green-100 text-green-800", id: "sdg8" },
            { number: 10, title: t("about.sdg.goals.reducedInequalities"), color: "bg-blue-100 text-blue-800", id: "sdg10" },
          ].map((goal) => (
            <div key={goal.number} id={goal.id} className={`p-4 rounded-lg ${goal.color} flex flex-col items-center text-center`}>
              <div className="font-bold text-xl mb-2">{t("about.sdg.goalNumber", { number: goal.number })}</div>
              <div>{goal.title}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
        <div className="flex justify-center order-last md:order-first">
          <Image
            src="/placeholder.svg?height=400&width=500&text=Our+Team"
            width={500}
            height={400}
            alt={t("about.ourTeamImageAlt")}
            className="rounded-lg object-cover"
          />
        </div>
        <div className="space-y-6">
          <h2 id="team" className="text-2xl font-bold scroll-mt-20">{t("about.ourTeam.title")}</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {t("about.ourTeam.paragraph1")}
            </p>
            <p className="text-muted-foreground">
              {t("about.ourTeam.paragraph2")}
            </p>
            <p className="text-muted-foreground">
              {t("about.ourTeam.paragraph3")}
            </p>
            <Button asChild>
              <Link href="/contact">{t("about.ourTeam.joinTeam")}</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-primary-600 text-primary-foreground rounded-lg p-8 md:p-12 mb-16">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-2xl font-bold">{t("about.ourImpact.title")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="space-y-2">
              <div className="text-4xl font-bold">{t("about.ourImpact.volunteerMentors.count")}</div>
              <div>{t("about.ourImpact.volunteerMentors.label")}</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">{t("about.ourImpact.mentorshipSessions.count")}</div>
              <div>{t("about.ourImpact.mentorshipSessions.label")}</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">{t("about.ourImpact.countriesReached.count")}</div>
              <div>{t("about.ourImpact.countriesReached.label")}</div>
            </div>
          </div>
          <p>
            {t("about.ourImpact.description")}
          </p>
        </div>
      </div>

      <div className="text-center mb-16">
        <h2 id="partners" className="text-2xl font-bold mb-4 scroll-mt-20">{t("about.ourPartners.title")}</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
          {t("about.ourPartners.description")}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-center">
              <Image
                src="/placeholder-logo.svg"
                width={150}
                height={75}
                alt={t("about.ourPartners.partnerLogoAlt", { number: i })}
                className="opacity-70 hover:opacity-100 transition-opacity"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-muted rounded-lg p-8 md:p-12 text-center">
        <h2 className="text-2xl font-bold mb-4">{t("about.joinOurMission.title")}</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
          {t("about.joinOurMission.description")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/signup">{t("about.joinOurMission.signUpNow")}</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/contact">{t("about.joinOurMission.contactUs")}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
