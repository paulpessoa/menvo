"use client"

import { Link, useRouter } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { useJoinOrganization } from "@/hooks/organizations/useJoinOrganization"
import { useMyMemberships } from "@/hooks/organizations/useMyMemberships"
import { toast } from "sonner"
import { CheckCircle2, Clock, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

type MembershipStatus = "none" | "requested" | "invited" | "active"

interface Props {
  slug: string
  orgName: string
  joinPolicy: "open" | "invite_only"
}

export function JoinOrganizationButton({ slug, orgName, joinPolicy }: Props) {
  const t = useTranslations("organizationLanding")
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const memberships = useMyMemberships(user?.id)
  const joinMutation = useJoinOrganization(user?.id)
  const submitting = joinMutation.isPending

  // null = ainda carregando. Falha ao buscar os vínculos conta como "sem vínculo"
  // (a pessoa ainda pode tentar entrar; o servidor decide).
  let status: MembershipStatus | null = null
  if (!authLoading) {
    if (!user) status = "none"
    else if (memberships.isError) status = "none"
    else if (memberships.data) {
      status = memberships.data.find(m => m.organizations.slug === slug)?.status ?? "none"
    }
  }

  const join = async () => {
    try {
      const result = await joinMutation.mutateAsync(slug)
      toast.success(result.message)
      if (result.data.status === "active") router.push("/dashboard")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a solicitação")
    }
  }

  if (authLoading || status === null) {
    return (
      <Button size="lg" disabled className="mt-2">
        <Loader2 className="animate-spin h-4 w-4" />
      </Button>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-3 mt-2">
        <Button asChild size="lg">
          <Link href={`/login?next=/o/${slug}`}>{t("joinToParticipate")}</Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          {t("noAccountYet")}{" "}
          <Link href={`/signup?next=/o/${slug}`} className="text-primary font-semibold hover:underline">
            {t("register")}
          </Link>{" "}
          {t("andReturnToRequest")}
        </p>
      </div>
    )
  }

  if (status === "active") {
    return (
      <div className="flex flex-col items-center gap-3 mt-2">
        <p className="flex items-center gap-2 text-primary font-semibold">
          <CheckCircle2 className="h-5 w-5" /> {t("youArePartOf", { name: orgName })}
        </p>
        <Button asChild size="lg" variant="outline">
          <Link href="/mentors">{t("findMentor")}</Link>
        </Button>
      </div>
    )
  }

  if (status === "requested") {
    return (
      <p className="flex items-center gap-2 text-muted-foreground mt-2">
        <Clock className="h-5 w-5" /> {t("requestedStatus")}
      </p>
    )
  }

  if (status !== "invited" && joinPolicy === "invite_only") {
    return (
      <p className="text-muted-foreground mt-2 text-center max-w-[400px]">
        {t("inviteOnlyMsg", { name: orgName })}
      </p>
    )
  }

  return (
    <Button size="lg" className="mt-2" onClick={join} disabled={submitting}>
      {submitting ? <Loader2 className="mr-2 animate-spin h-4 w-4" /> : null}
      {status === "invited" ? "Aceitar convite" : t("requestToJoin")}
    </Button>
  )
}
