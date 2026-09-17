import { notFound } from "next/navigation"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { PageContainer } from "@/components/layout/PageContainer"
import { createClient } from "@/lib/utils/supabase/server"

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getOrganization(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("organizations" as any)
    .select("slug, name, type")
    .eq("slug", slug)
    .maybeSingle()
  return data as { slug: string; name: string; type: string } | null
}

export default async function OrganizationLandingPage({ params }: PageProps) {
  const { slug } = await params
  const organization = await getOrganization(slug)

  if (!organization) notFound()

  return (
    <PageContainer size="3xl" className="flex flex-col items-center text-center gap-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{organization.name}</h1>
      <p className="text-muted-foreground max-w-[600px] md:text-lg">
        Você foi convidado pela {organization.name} para se conectar com mentores voluntários na
        Menvo — gratuito, sempre.
      </p>
      <Button asChild size="lg" className="mt-2">
        <Link href={`/o/${organization.slug}/signup`}>Criar minha conta</Link>
      </Button>
    </PageContainer>
  )
}
