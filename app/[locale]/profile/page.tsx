"use client"

import { MenvoDots } from "@/components/ui/menvo-loader"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import {  Eye, Settings , Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth"
import { useProfile } from "@/hooks/useProfile"
import { useOnboarding } from "@/hooks/useOnboarding"
import { Link, useRouter } from "@/i18n/routing"
import { OrganizationsTab } from "@/components/profile/OrganizationsTab"
import { ProfileAboutSection } from "@/components/profile/ProfileAboutSection"
import { ProfileCareerSection } from "@/components/profile/ProfileCareerSection"
import { ProfileMentorshipSection } from "@/components/profile/ProfileMentorshipSection"
import { profileToForm, type ProfileFormData } from "@/components/profile/profile-form"

type ProfileTab = "basic" | "career" | "mentorship" | "organizations"

// Old deep links (`?tab=address`, `?tab=interests`) point at tabs that were merged.
const TAB_ALIASES: Record<string, ProfileTab> = {
  basic: "basic", address: "basic",
  career: "career", interests: "career",
  mentorship: "mentorship", organizations: "organizations",
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <ProfilePageContent />
    </Suspense>
  )
}

function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <MenvoDots />
    </div>
  )
}

function ProfilePageContent() {
  const { user, refreshProfile, role, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading, isUpdating, updateProfile, refetch } = useProfile()
  const router = useRouter()
  const tabParam = useSearchParams().get("tab")
  const [activeTab, setActiveTab] = useState<ProfileTab>(TAB_ALIASES[tabParam ?? ""] ?? "basic")
  const [form, setForm] = useState<ProfileFormData | null>(null)

  const isMentor = role === "mentor"
  const isPendingMentor = Boolean(profile?.is_pending_mentor)

  useEffect(() => {
    const tab = TAB_ALIASES[tabParam ?? ""]
    if (tab) setActiveTab(tab)
  }, [tabParam])

  useEffect(() => {
    if (!authLoading && !user) {
      const fullPath = tabParam ? `/profile?tab=${tabParam}` : "/profile"
      router.push(`/login?next=${encodeURIComponent(fullPath)}`)
    }
  }, [authLoading, user, tabParam, router])

  // Seed the form once per loaded profile id - re-seeding on every profile
  // object change would wipe unsaved edits after a photo/CV upload refetch.
  useEffect(() => {
    if (profile && form === null) setForm(profileToForm(profile))
  }, [profile, form])

  if (authLoading || profileLoading || !profile || !form) return <FullPageSpinner />

  const patchForm = (patch: Partial<ProfileFormData>) => setForm((prev) => (prev ? { ...prev, ...patch } : prev))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.first_name?.trim() || !form.last_name?.trim() || !form.slug?.trim()) {
      toast.error("Por favor, preencha o Nome, Sobrenome e a URL do perfil (slug) antes de salvar.")
      setActiveTab("basic")
      return
    }

    const result = await updateProfile(form)
    if (result.success) {
      toast.success("Perfil salvo com sucesso!")
      if (result.data) setForm(profileToForm(result.data))
      await refreshProfile()
    } else {
      toast.error(result.error || "Erro ao salvar perfil")
    }
  }

  const handleStatusChange = async () => {
    await Promise.all([refreshProfile(), refetch()])
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Meu Perfil</h1>
            <p className="text-muted-foreground">Complete seu perfil para ser encontrado e ajudar/receber ajuda.</p>
          </div>
          <div className="flex gap-2">
            {profile.slug && (
              <Button variant="outline" asChild size="sm">
                <Link href={isMentor ? `/mentors/${profile.slug}` : `/mentee/${profile.slug}`}>
                  <Eye className="h-4 w-4 mr-2" /> Ver perfil público
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild size="sm">
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" /> Configurações
              </Link>
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProfileTab)} className="space-y-6">
            <TabsList id="tour-profile-tabs" className="grid w-full grid-cols-2 sm:grid-cols-4 bg-muted/50 p-1 h-auto">
              <TabsTrigger id="tour-tab-basic" value="basic" className="py-2">Perfil</TabsTrigger>
              <TabsTrigger id="tour-tab-career" value="career" className="py-2">Carreira e Interesses</TabsTrigger>
              <TabsTrigger id="tour-tab-mentorship" value="mentorship" className="py-2">Mentoria</TabsTrigger>
              <TabsTrigger id="tour-tab-organizations" value="organizations" className="py-2">Organizações</TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <ProfileAboutSection form={form} onChange={patchForm} isMentor={isMentor} />
            </TabsContent>
            <TabsContent value="career">
              <ProfileCareerSection form={form} onChange={patchForm} isMentor={isMentor} />
            </TabsContent>
            <TabsContent value="mentorship">
              <ProfileMentorshipSection
                form={form}
                onChange={patchForm}
                isMentor={isMentor}
                isPendingMentor={isPendingMentor}
                onStatusChange={handleStatusChange}
              />
            </TabsContent>
            <TabsContent value="organizations">
              <OrganizationsTab />
            </TabsContent>

            {/* One save for every tab - edits made on other tabs are kept in state and saved together. */}
            {activeTab !== "organizations" && (
              <div className="sticky bottom-0 flex justify-end gap-4 py-4 border-t bg-background/95 backdrop-blur">
                <Button id="tour-profile-save" type="submit" disabled={isUpdating} className="min-w-[150px] shadow-lg shadow-primary/20">
                  {isUpdating && <Loader2 className="mr-2 animate-spin h-4 w-4" />}
                  Salvar perfil
                </Button>
              </div>
            )}
          </Tabs>
        </form>
      </div>
      <ProfileTour />
    </div>
  )
}

function ProfileTour() {
  const steps = [
    { popover: { title: "Boas-vindas ao seu Perfil!", description: "Aqui é onde a comunidade vai te conhecer. Um perfil completo abre muitas portas." } },
    { 
      element: "#tour-tab-basic", 
      onHighlightStarted: () => { document.getElementById("tour-tab-basic")?.click() },
      popover: { title: "Perfil Básico", description: "Sua foto, nome e resumo (bio) são o seu cartão de visitas. Perfis bem preenchidos têm muito mais chances de receber pedidos e aceites na comunidade!" } 
    },
    {
      element: "#tour-profile-public",
      popover: { title: "Perfil Público", description: "Ative para ser visível na rede! Mentores precisam disso para aparecerem no catálogo. Mentorados precisam para que os mentores possam ler o perfil antes de aceitar." }
    },
    { 
      element: "#tour-tab-career", 
      onHighlightStarted: () => { document.getElementById("tour-tab-career")?.click() },
      popover: { title: "O que você busca?", description: "Na aba Carreira e Interesses, deixe claro sua experiência e o que você espera das mentorias. Isso ajuda nossa IA a te recomendar para as pessoas certas." } 
    },
    { 
      element: "#tour-tab-mentorship", 
      onHighlightStarted: () => { document.getElementById("tour-tab-mentorship")?.click() },
      popover: { title: "Seja um Mentor(a)!", description: "Compartilhar conhecimento é transformador! Se você tem experiência, ative seu perfil de mentor aqui. Retribuir à comunidade ensinando os outros é incrível." } 
    },
    { 
      element: "#tour-tab-basic", 
      onHighlightStarted: () => { document.getElementById("tour-tab-basic")?.click() },
      popover: { title: "Tudo pronto?", description: "Volte para a primeira aba e comece a preencher seus dados. (Dica: A localização pode ser preenchida automaticamente usando o botão 'Detectar'!)" } 
    },
    { 
      element: "#tour-profile-save", 
      popover: { title: "Não esqueça de salvar", description: "Lembre-se sempre de clicar em 'Salvar perfil' no final para não perder suas alterações!" } 
    }
  ]

  useOnboarding("ob_m4", steps)

  return null
}
