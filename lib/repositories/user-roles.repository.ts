/**
 * Camada 5 · Repository (papéis do usuário)
 * Regra: único ponto que fala com `roles` e `user_roles` para a troca de papel
 * mentor/mentee. Dois contratos separados de propósito:
 *  - `RolesCatalog` só LÊ `roles` e roda com o client da sessão;
 *  - `UserRolesRepository` ESCREVE `user_roles` e é o único uso de
 *    `service_role` desta linha (ADR 0008, exceção E2): a escrita foi fechada
 *    para usuário comum em 20261003030000 porque qualquer conta podia se dar o
 *    papel `admin`. Até a RPC `set_my_role` existir, só o servidor escreve.
 * Não faz: decidir QUEM pode ter QUAL papel (camada 7). O service só pede
 * `mentor` ou `mentee` e passa o `userId` da sessão; este repository não sabe
 * o que é admin e por isso não deve receber um nome de papel de fora.
 * Tradeoff: "checar e inserir" em vez de upsert, porque `user_roles` não tem
 * `unique(user_id, role_id)` (upsert falha com 42P10). Dois cliques rápidos
 * ainda podem duplicar a linha; a constraint é a migration M1 do ADR 0008.
 * O client privilegiado chega como função: só é criado quando alguém escreve.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { ProfileRepositoryError } from "./profile.repository"

export interface RoleRow {
  id: number
  name: string
}

export interface RolesCatalog {
  /** Ids dos papéis pedidos; papel desconhecido simplesmente não volta. */
  findByNames(names: readonly string[]): Promise<RoleRow[]>
}

export interface UserRolesRepository {
  remove(userId: string, roleIds: readonly number[]): Promise<void>
  /** `true` se criou a linha, `false` se já existia. */
  addIfMissing(userId: string, roleId: number): Promise<boolean>
}

export function createRolesCatalog(db: SupabaseClient<Database>): RolesCatalog {
  return {
    async findByNames(names) {
      const { data, error } = await db.from("roles").select("id, name").in("name", [...names])
      if (error) throw new ProfileRepositoryError("roles.findByNames", error)
      return data ?? []
    },
  }
}

export function createUserRolesRepository(getDb: () => SupabaseClient<Database>): UserRolesRepository {
  return {
    async remove(userId, roleIds) {
      if (roleIds.length === 0) return
      const { error } = await getDb().from("user_roles").delete().eq("user_id", userId).in("role_id", [...roleIds])
      if (error) throw new ProfileRepositoryError("userRoles.remove", error)
    },

    async addIfMissing(userId, roleId) {
      const db = getDb()
      const { data: existing, error: findError } = await db
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role_id", roleId)
        .maybeSingle()
      if (findError) throw new ProfileRepositoryError("userRoles.addIfMissing", findError)
      if (existing) return false

      const { error } = await db.from("user_roles").insert({ user_id: userId, role_id: roleId })
      if (error) throw new ProfileRepositoryError("userRoles.addIfMissing", error)
      return true
    },
  }
}
