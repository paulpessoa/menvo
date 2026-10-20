"use client"

import { MenvoDots } from "@/components/ui/menvo-loader"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth"
import { useOwnProfile } from "@/hooks/profile/useOwnProfile"
import { useUpdateProfile } from "@/hooks/profile/useUpdateProfile"
import { useRouter } from "@/i18n/routing"
import { OrganizationsTab } from "@/components/profile/OrganizationsTab"
import { ProfileAboutSection } from "@/components/profile/ProfileAboutSection"
import { ProfileCareerSection } from "@/components/profile/ProfileCareerSection"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { ProfileMentorshipSection } from "@/components/profile/ProfileMentorshipSection"
import { ProfileTour } from "@/components/profile/ProfileTour"
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
  const { profile, loading: profileLoading, refetch } = useOwnProfile()
  const { mutateAsync: updateProfile, isPending: isUpdating } = useUpdateProfile()
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

    try {
      // O hook já recarrega o perfil da sessão e invalida perfil e catálogo.
      const saved = await updateProfile(form)
      toast.success("Perfil salvo com sucesso!")
      if (saved) setForm(profileToForm(saved))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar perfil")
    }
  }

  const handleStatusChange = async () => {
    await Promise.all([refreshProfile(), refetch()])
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        <ProfileHeader slug={profile.slug} isMentor={isMentor} />

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
                verificationStatus={profile.verification_status}
                onStatusChange={handleStatusChange}
              />
            </TabsContent>
            <TabsContent value="organizations">
              <OrganizationsTab />
            </TabsContent>

            {/* One save for every tab - edits made on other tabs are kept in state and saved together. */}
            {activeTab !== "organizations" && !(activeTab === "mentorship" && !isMentor && !isPendingMentor) && (
              <div className="sticky bottom-0 flex justify-end gap-4 py-4 border-t bg-canvas/95 backdrop-blur">
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
