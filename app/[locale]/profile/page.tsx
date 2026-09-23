"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Eye, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth"
import { useProfile } from "@/hooks/useProfile"
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
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

  // Seed the form once per loaded profile id — re-seeding on every profile
  // object change would wipe unsaved edits after a photo/CV upload refetch.
  useEffect(() => {
    if (profile && form === null) setForm(profileToForm(profile))
  }, [profile, form])

  if (authLoading || profileLoading || !profile || !form) return <FullPageSpinner />

  const patchForm = (patch: Partial<ProfileFormData>) => setForm((prev) => (prev ? { ...prev, ...patch } : prev))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
          {profile.slug && (
            <Button variant="outline" asChild size="sm">
              <Link href={isMentor ? `/mentors/${profile.slug}` : `/mentee/${profile.slug}`}>
                <Eye className="h-4 w-4 mr-2" /> Ver perfil público
              </Link>
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProfileTab)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-muted/50 p-1 h-auto">
              <TabsTrigger value="basic" className="py-2">Perfil</TabsTrigger>
              <TabsTrigger value="career" className="py-2">Carreira e Interesses</TabsTrigger>
              <TabsTrigger value="mentorship" className="py-2">Mentoria</TabsTrigger>
              <TabsTrigger value="organizations" className="py-2">Organizações</TabsTrigger>
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

            {/* One save for every tab — edits made on other tabs are kept in state and saved together. */}
            {activeTab !== "organizations" && (
              <div className="sticky bottom-0 flex justify-end gap-4 py-4 border-t bg-background/95 backdrop-blur">
                <Button type="submit" disabled={isUpdating} className="min-w-[150px] shadow-lg shadow-primary/20">
                  {isUpdating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Salvar perfil
                </Button>
              </div>
            )}
          </Tabs>
        </form>
      </div>
    </div>
  )
}
