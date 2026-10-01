"use client"

import { PageContainer } from "@/components/layout/PageContainer"
import { RequireRole } from "@/lib/auth/auth-guard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Inbox } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import ActiveOrganizationsTab from "@/components/admin/organizations/ActiveOrganizationsTab"
import OrgLeadsTab from "@/components/admin/organizations/OrgLeadsTab"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

function OrganizationsDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'leads'

  const handleTabChange = (val: string) => {
    router.replace(`/dashboard/admin/organizations?tab=${val}`)
  }

  return (
    <RequireRole roles={["admin"]}>
      <PageContainer>
        <div className="space-y-8">
          <div>
            <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4 text-muted-foreground hover:text-foreground">
              <Link href="/dashboard/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              Organizações
            </h1>
            <p className="text-muted-foreground text-lg mt-2">Gerencie organizações parceiras e pedidos de novas organizações.</p>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 gap-8">
              <TabsTrigger 
                value="leads" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-3 bg-transparent font-bold text-base flex items-center gap-2"
              >
                <Inbox className="w-4 h-4" /> Interessadas
              </TabsTrigger>
              <TabsTrigger 
                value="active" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-3 bg-transparent font-bold text-base flex items-center gap-2"
              >
                <Building2 className="w-4 h-4" /> Ativas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="leads" className="mt-0 outline-none">
              <OrgLeadsTab />
            </TabsContent>

            <TabsContent value="active" className="mt-0 outline-none">
              <ActiveOrganizationsTab />
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </RequireRole>
  )
}

export default function AdminOrganizationsPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <OrganizationsDashboardContent />
    </Suspense>
  )
}
