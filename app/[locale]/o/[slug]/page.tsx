import { Metadata } from "next"
import { notFound } from "next/navigation"
import { PageContainer } from "@/components/layout/PageContainer"
import { JoinOrganizationButton } from "@/components/organizations/JoinOrganizationButton"
import { orgPublicService } from "@/lib/services/organizations/org-public.service"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const organization = await orgPublicService.getOrganizationBySlug(slug)

  if (!organization) {
    return { title: "Organização não encontrada | Menvo", robots: { index: false, follow: false } }
  }

  const title = `${organization.name} na Menvo`
  const description = `A ${organization.name} é parceira da Menvo e conecta seus beneficiários a mentores voluntários gratuitos.`
  const canonicalPath = `/o/${slug}`

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "website",
      url: `https://www.menvo.com.br${canonicalPath}`,
      title,
      description,
      images: [{ url: "https://www.menvo.com.br/images/menvopeople.jpg", width: 1200, height: 630, alt: title }]
    },
    // Invite-only orgs aren't meant to be discovered by strangers - keep
    // them out of search results even though the page itself still works
    // for anyone holding the direct link.
    robots: (organization as any).join_policy === "invite_only"
      ? { index: false, follow: false }
      : { index: true, follow: true }
  }
}

import { getTranslations } from "next-intl/server"

export default async function OrganizationLandingPage({ params }: PageProps) {
  const { slug } = await params
  const [organization, t] = await Promise.all([
    orgPublicService.getOrganizationBySlug(slug),
    getTranslations("organizationLanding")
  ])

  if (!organization) notFound()

  return (
    <PageContainer size="3xl" className="flex flex-col items-center text-center gap-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{organization.name}</h1>
      <p className="text-muted-foreground max-w-[600px] md:text-lg">
        {t("subtitle", { name: organization.name })}
      </p>
      <JoinOrganizationButton
        slug={organization.slug}
        orgName={organization.name}
        joinPolicy={(organization as any).join_policy ?? "open"}
      />
    </PageContainer>
  )
}
