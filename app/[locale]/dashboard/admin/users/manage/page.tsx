import { redirect } from "@/i18n/routing"

/**
 * Legacy admin user screen. It had its own "Verificar Usuário" toggle that
 * only flipped `profiles.verified` — a third, divergent way to approve
 * mentors. Everything it did now lives in /dashboard/admin/users (edit,
 * roles, delete) and /dashboard/admin/verifications (approvals).
 */
export default async function LegacyAdminUsersManagePage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  redirect({ href: "/dashboard/admin/users", locale })
}
