"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "@/i18n/routing"
import { useAuth } from "@/lib/auth"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { 
  Users, 
  GraduationCap, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Loader2, 
  MapPin, 
  Briefcase, 
  Building2, 
  Linkedin, 
  Compass, 
  Check 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const MENTEE_TOPICS = [
  "Frontend",
  "Backend",
  "Fullstack",
  "Mobile",
  "UI/UX Design",
  "Gestão de Produto",
  "Dados & IA",
  "Carreira & Soft Skills",
  "QA & Testes"
]

const MENTOR_TOPICS = [
  "Carreira & Entrevistas",
  "Arquitetura de Software",
  "Transição para Tecnologia",
  "Portfólio & LinkedIn",
  "Liderança & Gestão Técnica",
  "Design Systems & UX",
  "Produto & Estratégia"
]

const MENTEE_GOALS = [
  "Conquistar o 1º emprego em tecnologia",
  "Fazer transição de carreira para tech",
  "Evoluir para nível Pleno / Sênior",
  "Aprimorar código e arquitetura",
  "Networking com profissionais referência"
]

export default function OnboardingPage() {
  const t = useTranslations("onboarding")
  const tc = useTranslations("common")
  const router = useRouter()
  const { user, profile, role, loading, needsRoleSelection, refreshProfile, getDefaultRedirectPath } = useAuth()

  const [step, setStep] = useState<1 | 2>(1)
  const [selectedRole, setSelectedRole] = useState<"mentee" | "mentor" | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)

  // Mentee form state
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [selectedGoal, setSelectedGoal] = useState<string>("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")

  // Mentor form state
  const [jobTitle, setJobTitle] = useState("")
  const [company, setCompany] = useState("")
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [bio, setBio] = useState("")

  // Authentication & existing role guard
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login?next=/onboarding")
        return
      }

      // If user already has a complete role and doesn't need role selection, redirect
      if (role && !needsRoleSelection()) {
        router.push(getDefaultRedirectPath())
      }
    }
  }, [user, role, loading, needsRoleSelection, router, getDefaultRedirectPath])

  // Prefill from existing profile if available
  useEffect(() => {
    if (profile) {
      if (profile.city && !city) setCity(profile.city)
      if (profile.state && !state) setState(profile.state)
      if (profile.job_title && !jobTitle) setJobTitle(profile.job_title)
      if (profile.company && !company) setCompany(profile.company)
      if (profile.linkedin_url && !linkedinUrl) setLinkedinUrl(profile.linkedin_url)
      if (profile.bio && !bio) setBio(profile.bio)
    }
  }, [profile])

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    )
  }

  const handleAutoLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não é suportada pelo seu navegador.")
      return
    }

    setIsDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )
          const data = await response.json()
          if (data && data.address) {
            const detectedCity =
              data.address.city ||
              data.address.town ||
              data.address.municipality ||
              data.address.village ||
              ""
            const detectedState = data.address.state || ""
            if (detectedCity) setCity(detectedCity)
            if (detectedState) setState(detectedState)
            toast.success("Localização identificada com sucesso!")
          }
        } catch {
          toast.error("Não foi possível identificar a cidade automaticamente.")
        } finally {
          setIsDetectingLocation(false)
        }
      },
      () => {
        setIsDetectingLocation(false)
        toast.error("Permissão de localização negada ou indisponível.")
      }
    )
  }

  const handleCompleteOnboarding = async () => {
    if (!selectedRole || !user) return

    setIsSubmitting(true)
    try {
      const profileData: Record<string, any> = {
        city: city.trim() || null,
        state: state.trim() || null,
        country: "Brasil"
      }

      if (selectedRole === "mentee") {
        profileData.mentorship_topics = selectedTopics
        profileData.learning_goals = selectedGoal
      } else {
        profileData.job_title = jobTitle.trim() || null
        profileData.company = company.trim() || null
        profileData.linkedin_url = linkedinUrl.trim() || null
        profileData.bio = bio.trim() || null
        profileData.mentorship_topics = selectedTopics
        profileData.expertise_areas = selectedTopics
      }

      const response = await fetch("/api/profile/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          profileData
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || t("error.saveError"))
      }

      await refreshProfile()

      toast.success(
        selectedRole === "mentor"
          ? t("mentor.success")
          : t("mentee.success")
      )

      // Direct to corresponding dashboard
      if (selectedRole === "mentor") {
        router.push("/dashboard/mentor")
      } else {
        router.push("/dashboard/mentee")
      }
    } catch (err: any) {
      console.error("Onboarding error:", err)
      toast.error(err.message || t("error.saveError"))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || (!user && !role)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{tc("loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50/80 via-white to-gray-50/80 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Progress Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            {step === 1 ? t("step1") : t("step2")}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            {step === 1 ? t("title") : t("customizeTitle")}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            {step === 1
              ? t("description")
              : selectedRole === "mentor"
              ? t("mentorSubtitle")
              : t("menteeSubtitle")}
          </p>
        </div>

        {/* STEP 1: ROLE SELECTION */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mentee Option */}
              <Card
                role="button"
                tabIndex={0}
                aria-pressed={selectedRole === "mentee"}
                onClick={() => setSelectedRole("mentee")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setSelectedRole("mentee")
                  }
                }}
                className={`relative cursor-pointer transition-all duration-200 border-2 hover:shadow-lg rounded-2xl ${
                  selectedRole === "mentee"
                    ? "border-primary bg-primary/[0.03] ring-2 ring-primary/20 shadow-md"
                    : "border-border hover:border-primary/40 bg-card"
                }`}
              >
                {selectedRole === "mentee" && (
                  <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                )}
                <CardHeader className="space-y-3 pb-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Users className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-bold text-foreground">
                    {t("mentee.title")}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {t("mentee.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("benefitsLabel")}
                  </span>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Sessões 1-on-1 gratuitas com profissionais atuantes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Descoberta inteligente de mentores por afinidade e quiz</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Comunidade ativa e orientações práticas de carreira</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Mentor Option */}
              <Card
                role="button"
                tabIndex={0}
                aria-pressed={selectedRole === "mentor"}
                onClick={() => setSelectedRole("mentor")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setSelectedRole("mentor")
                  }
                }}
                className={`relative cursor-pointer transition-all duration-200 border-2 hover:shadow-lg rounded-2xl ${
                  selectedRole === "mentor"
                    ? "border-primary bg-primary/[0.03] ring-2 ring-primary/20 shadow-md"
                    : "border-border hover:border-primary/40 bg-card"
                }`}
              >
                {selectedRole === "mentor" && (
                  <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                )}
                <CardHeader className="space-y-3 pb-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-bold text-foreground">
                    {t("mentor.title")}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {t("mentor.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("benefitsLabel")}
                  </span>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Retribua conhecimento gerando impacto social real</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Total flexibilidade de horários e agendamento pelo Google Meet</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Perfil público verificado e reconhecimento na comunidade</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                size="lg"
                disabled={!selectedRole}
                onClick={() => setStep(2)}
                className="px-8 font-semibold gap-2 shadow-sm rounded-xl"
              >
                {t("continue")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: PROFILE CUSTOMIZATION */}
        {step === 2 && (
          <Card className="border-border rounded-2xl shadow-sm">
            <CardHeader className="space-y-1 pb-6 border-b border-border/50">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="px-3 py-1 text-xs">
                  {selectedRole === "mentor" ? "Perfil de Mentor" : "Perfil de Mentorado"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Leva menos de 1 minuto
                </span>
              </div>
              <CardTitle className="text-xl font-bold text-foreground pt-2">
                {selectedRole === "mentor" ? "Dados Profissionais" : "Seus Interesses"}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {/* MENTEE STEP 2 */}
              {selectedRole === "mentee" && (
                <>
                  {/* Topics of Interest */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-foreground">
                      {t("interestsLabel")}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Selecione um ou mais tópicos que você gostaria de explorar:
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {MENTEE_TOPICS.map((topic) => {
                        const isSelected = selectedTopics.includes(topic)
                        return (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => toggleTopic(topic)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary"
                                : "bg-muted hover:bg-muted/80 text-foreground border border-border"
                            }`}
                          >
                            {isSelected && <Check className="inline-block h-3 w-3 mr-1" />}
                            {topic}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Primary Goal */}
                  <div className="space-y-3 pt-2">
                    <Label className="text-sm font-semibold text-foreground">
                      {t("goalLabel")}
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {MENTEE_GOALS.map((goal) => {
                        const isSelected = selectedGoal === goal
                        return (
                          <button
                            key={goal}
                            type="button"
                            onClick={() => setSelectedGoal(goal)}
                            className={`text-left p-3 rounded-xl text-xs font-medium transition-all border ${
                              isSelected
                                ? "border-primary bg-primary/[0.04] text-primary ring-1 ring-primary"
                                : "border-border hover:border-border/80 bg-background text-foreground"
                            }`}
                          >
                            {goal}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-foreground">
                        {t("locationLabel")}
                      </Label>
                      <button
                        type="button"
                        onClick={handleAutoLocation}
                        disabled={isDetectingLocation}
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium"
                      >
                        {isDetectingLocation ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <MapPin className="h-3.5 w-3.5" />
                        )}
                        {t("autoLocation")}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Cidade (ex: Recife)"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="rounded-xl"
                      />
                      <Input
                        placeholder="Estado (ex: PE)"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* MENTOR STEP 2 */}
              {selectedRole === "mentor" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle" className="text-sm font-semibold text-foreground">
                        {t("jobTitleLabel")} *
                      </Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="jobTitle"
                          placeholder="Ex: Senior Software Engineer"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          className="pl-9 rounded-xl"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-sm font-semibold text-foreground">
                        {t("companyLabel")}
                      </Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="company"
                          placeholder="Ex: Nubank, CESAR, Autônomo"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          className="pl-9 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedinUrl" className="text-sm font-semibold text-foreground">
                      {t("linkedinLabel")}
                    </Label>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-3 h-4 w-4 text-[#0A66C2]" />
                      <Input
                        id="linkedinUrl"
                        type="url"
                        placeholder="https://linkedin.com/in/seu-perfil"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="pl-9 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Mentor Topics */}
                  <div className="space-y-3 pt-2">
                    <Label className="text-sm font-semibold text-foreground">
                      Tópicos que deseja mentorar
                    </Label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {MENTOR_TOPICS.map((topic) => {
                        const isSelected = selectedTopics.includes(topic)
                        return (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => toggleTopic(topic)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary"
                                : "bg-muted hover:bg-muted/80 text-foreground border border-border"
                            }`}
                          >
                            {isSelected && <Check className="inline-block h-3 w-3 mr-1" />}
                            {topic}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Short Bio */}
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="bio" className="text-sm font-semibold text-foreground">
                      {t("bioLabel")}
                    </Label>
                    <Textarea
                      id="bio"
                      rows={3}
                      placeholder={t("bioPlaceholder")}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="rounded-xl resize-none"
                    />
                  </div>
                </>
              )}
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t border-border/50 pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="gap-2 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("back")}
              </Button>

              <Button
                type="button"
                onClick={handleCompleteOnboarding}
                disabled={isSubmitting || (selectedRole === "mentor" && !jobTitle.trim())}
                className="gap-2 px-6 rounded-xl font-semibold shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  <>
                    {t("finish")}
                    <Check className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </main>
  )
}
