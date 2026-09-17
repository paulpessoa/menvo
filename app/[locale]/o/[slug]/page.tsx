import { notFound } from "next/navigation"
import { PageContainer } from "@/components/layout/PageContainer"
import { JoinOrganizationButton } from "@/components/organizations/JoinOrganizationButton"
import { createClient } from "@/lib/utils/supabase/server"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function OrganizationLandingPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: organization } = await supabase
    .from("organizations")
    .select("slug, name, type")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle()

  if (!organization) notFound()

  return (
    <PageContainer size="3xl" className="flex flex-col items-center text-center gap-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{organization.name}</h1>
      <p className="text-muted-foreground max-w-[600px] md:text-lg">
        A {organization.name} é parceira da Menvo. Participe do grupo dela para se conectar com
        mentores voluntários — gratuito, sempre.
      </p>
      <JoinOrganizationButton slug={organization.slug} orgName={organization.name} />
    </PageContainer>
  )
}
