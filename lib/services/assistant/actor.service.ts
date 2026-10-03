import type { SupabaseClient } from "@supabase/supabase-js"
import type { Actor } from "@/lib/agents/define"

/**
 * Resolves the agent actor (id + highest role) for a logged-in user. Shared by
 * the assistant stream and the confirm endpoint so both filter capabilities by
 * the same role, with the same precedence: admin > mentor > mentee.
 */
export async function resolveActor(supabase: SupabaseClient, userId: string): Promise<Actor> {
  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", userId)
    .returns<{ roles: { name: string } | null }[]>()

  const roleNames = (roleRows ?? []).map((r) => r.roles?.name).filter(Boolean)
  const role = roleNames.includes("admin") ? "admin" : roleNames.includes("mentor") ? "mentor" : "mentee"
  return { id: userId, role }
}
