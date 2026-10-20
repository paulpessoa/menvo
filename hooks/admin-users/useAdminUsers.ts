"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { getJson } from "@/lib/query/http"
import { adminUsersKeys } from "@/lib/query/keys/admin-users"
import type { AdminUsersQuery } from "@/lib/schemas/admin-users"
import { adminUsersResponseSchema } from "@/lib/schemas/admin-users-responses"

/** Filtros da lista como a tela os conhece: tudo opcional, o servidor aplica os padrões. */
export type AdminUsersFilters = Partial<AdminUsersQuery>

/** Só os filtros preenchidos vão para a URL (vazio e `undefined` caem no padrão do servidor). */
function toSearchParams(filters: AdminUsersFilters): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.set(key, String(value))
  }
  return params.toString()
}

/**
 * Lista paginada de usuários do painel admin, com contagens por filtro. A
 * página anterior fica na tela até a nova chegar (paginar e filtrar sem
 * piscar). A chave leva o filtro inteiro; editar ou apagar invalida todas as
 * páginas pelo prefixo `adminUsersKeys.all`.
 */
export function useAdminUsers(filters: AdminUsersFilters = {}) {
  return useQuery({
    queryKey: adminUsersKeys.list(filters),
    retry: false,
    placeholderData: keepPreviousData,
    queryFn: () => getJson(`/api/admin/users?${toSearchParams(filters)}`, adminUsersResponseSchema),
    select: (response) => response.data,
  })
}
