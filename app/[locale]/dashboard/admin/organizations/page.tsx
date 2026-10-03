"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageContainer } from "@/components/layout/PageContainer"
import { RequireRole } from "@/lib/auth/auth-guard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MenvoDots } from "@/components/ui/menvo-loader"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import ActiveOrganizationsTab from "@/components/admin/organizations/ActiveOrganizationsTab"
import OrgLeadsTab from "@/components/admin/organizations/OrgLeadsTab"

const TAB_CLASS =
  "data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-3 bg-transparent font-semibold text-sm md:text-base"

function OrganizationsDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") || "leads"

  const handleTabChange = (val: string) => {
    router.replace(`/dashboard/admin/organizations?tab=${val}`)
  }

  return (
    <RequireRole roles={["admin"]}>
      <PageContainer>
        <AdminPageHeader
          title="Organizações"
          description="Gerencie organizações parceiras e pedidos de novas organizações."
        />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 gap-8">
            <TabsTrigger value="leads" className={TAB_CLASS}>
              Interessadas
            </TabsTrigger>
            <TabsTrigger value="active" className={TAB_CLASS}>
              Ativas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="mt-0 outline-none">
            <OrgLeadsTab />
          </TabsContent>

          <TabsContent value="active" className="mt-0 outline-none">
            <ActiveOrganizationsTab />
          </TabsContent>
        </Tabs>
      </PageContainer>
    </RequireRole>
  )
}

/** Partner organizations and inbound org leads; the active tab lives in `?tab=` so links can deep-link to it. */
export default function AdminOrganizationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <MenvoDots />
        </div>
      }
    >
      <OrganizationsDashboardContent />
    </Suspense>
  )
}
