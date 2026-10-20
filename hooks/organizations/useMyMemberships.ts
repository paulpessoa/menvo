"use client"

import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { getJson } from "@/lib/query/http"
import { orgKeys } from "@/lib/query/keys/org"
import { myMembershipSchema, orgEnvelope, type MyMembership } from "@/lib/schemas/organizations"

/** Vínculo cuja organização a RLS deixou ver (a UI só sabe desenhar esses). */
export type MembershipWithOrg = Omit<MyMembership, "organizations"> & {
  organizations: NonNullable<MyMembership["organizations"]>
}

const responseSchema = orgEnvelope(z.array(myMembershipSchema))

/**
 * Convites, pedidos e participações da própria pessoa. Um cache só para a aba
 * do perfil e para o botão da página pública da org: aceitar o convite em um
 * lugar atualiza o outro. A chave leva o id da pessoa, então outra conta nunca
 * vê o cache da anterior. Vínculos sem organização visível são descartados.
 */
export function useMyMemberships(userId: string | undefined) {
  return useQuery({
    queryKey: orgKeys.memberships(userId ?? ""),
    enabled: !!userId,
    retry: false,
    queryFn: () => getJson("/api/me/organizations", responseSchema),
    select: (response): MembershipWithOrg[] =>
      response.data.filter((m): m is MembershipWithOrg => m.organizations !== null),
  })
}
