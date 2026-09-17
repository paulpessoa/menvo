import { Suspense } from "react"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/utils/supabase/server"
import { SignupForm } from "@/app/[locale]/(auth)/signup/page"

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getOrganization(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("organizations" as any)
    .select("slug, name")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle()
  return data as { slug: string; name: string } | null
}

export default async function OrganizationSignupPage({ params }: PageProps) {
  const { slug } = await params
  const organization = await getOrganization(slug)

  if (!organization) notFound()

  return (
    <div className="relative container py-10 md:py-16 flex justify-center">
      <Suspense fallback={<div>Carregando...</div>}>
        <SignupForm orgSlug={organization.slug} orgName={organization.name} />
      </Suspense>
    </div>
  )
}
