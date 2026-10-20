"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { z } from "zod"
import type { OrgPeriod } from "@/lib/domain/organizations/organization.entity"
import { getJson } from "@/lib/query/http"
import { orgKeys } from "@/lib/query/keys/org"
import { myOrgOptionSchema, orgDashboardSchema, orgEnvelope } from "@/lib/schemas/organizations"

const mineSchema = orgEnvelope(z.array(myOrgOptionSchema))
const dashboardSchema = orgEnvelope(orgDashboardSchema)

/** As organizações que a pessoa administra (a primeira abre em /dashboard/org). */
export function useMyAdminOrganizations() {
  return useQuery({
    queryKey: orgKeys.mine,
    retry: false,
    queryFn: () => getJson("/api/org/mine", mineSchema),
    select: response => response.data,
  })
}

/**
 * Dashboard de uma org para um período. Trocar o período mantém os números
 * anteriores na tela até chegarem os novos (sem piscar o spinner). Ações do
 * admin invalidam todos os períodos pelo prefixo `orgKeys.dashboardOf`.
 */
export function useOrgDashboard(orgId: string | undefined, period: OrgPeriod) {
  return useQuery({
    queryKey: orgKeys.dashboard(orgId ?? "", period),
    enabled: !!orgId,
    retry: false,
    placeholderData: keepPreviousData,
    queryFn: () => getJson(`/api/org/${orgId}?period=${period}`, dashboardSchema),
    select: response => response.data,
  })
}
