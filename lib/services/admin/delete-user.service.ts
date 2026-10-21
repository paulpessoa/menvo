import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { createServiceRoleClient, ensureServerSide } from "@/lib/utils/supabase/service-role"
import { assertAdmin } from "./assert-admin"
import { AdminSelfActionError } from "./self-action.error"
import { hashEmail, suppress } from "@/lib/services/invites/suppression.service"
import { CV_BUCKET, cvStoragePath } from "@/lib/services/mentees/cv-storage"

/** Storage buckets that store files under a `${userId}/...` prefix (see app/api/upload/*). */
const USER_FILE_BUCKETS = ["cvs", "avatars"] as const

export type DeletionSource = "invite_token" | "self_service" | "admin" | "retention_policy" | "inactivity_policy"

export interface DeleteUserResult {
  success: true
  filesRemoved: number
}

/**
 * The one place a Menvo account is permanently deleted - used by the
 * admin "remove user" action and by the public invite-token self-service
 * deletion flow, so both paths log the same LGPD deletion record, clear
 * the same storage files, and suppress the same e-mail from future
 * campaigns/imports.
 *
 * Needs a service-role client because deleting from `auth.users` requires
 * the Admin API (there is no user-facing equivalent). The client is passed
 * in, never created here: the admin path gets it from
 * `delete-user.composition.ts` after `assertAdmin`. See
 * docs/domains/reengagement-invites.md §3.3 and ADR 0009 for why this is a
 * deliberate, scoped exception to the "never use service_role as a shortcut"
 * rule in AGENTS.md rather than a violation of it.
 *
 * @param supabase Privileged client; the caller must already be authorized.
 */
export async function deleteUserWithClient(
  supabase: SupabaseClient<Database>,
  userId: string,
  options: { source: DeletionSource; campaign?: string }
): Promise<DeleteUserResult> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle()

  if (profileError) throw profileError
  const email = profile?.email ?? null

  let deletionLogId: string | null = null
  if (email) {
    const { data: logRow, error: logError } = await supabase
      .from("data_deletion_log")
      .insert({
        email_hash: hashEmail(email),
        source: options.source,
        campaign: options.campaign ?? null
      })
      .select("id")
      .single()

    if (logError) throw logError
    deletionLogId = logRow.id
  }

  let filesRemoved = 0

  // Currículos importados ficam fora da pasta do usuário
  // (estagio-recife/<userId>_cv.pdf); a listagem por pasta abaixo não os acha.
  const { data: mentee } = await supabase
    .from("mentee_profiles")
    .select("cv_url")
    .eq("user_id", userId)
    .maybeSingle()
  const cvPath = cvStoragePath(mentee?.cv_url, userId)
  if (cvPath && !cvPath.startsWith(`${userId}/`)) {
    const { error: removeError } = await supabase.storage.from(CV_BUCKET).remove([cvPath])
    if (!removeError) filesRemoved += 1
  }

  for (const bucket of USER_FILE_BUCKETS) {
    const { data: files, error: listError } = await supabase.storage.from(bucket).list(userId)
    if (listError || !files?.length) continue

    const paths = files.map(file => `${userId}/${file.name}`)
    const { error: removeError } = await supabase.storage.from(bucket).remove(paths)
    if (!removeError) filesRemoved += paths.length
  }

  const { error: authError } = await supabase.auth.admin.deleteUser(userId)
  if (authError) {
    // The auth user may already be gone (e.g. a retried request); the
    // profile delete below is the real source of truth either way.
    console.warn(`[deleteUserCompletely] auth.admin.deleteUser failed for ${userId}:`, authError.message)
  }

  const { error: profileDeleteError } = await supabase.from("profiles").delete().eq("id", userId)
  if (profileDeleteError) throw profileDeleteError

  if (email) {
    await suppress(email, "deleted")
  }

  if (deletionLogId) {
    await supabase
      .from("data_deletion_log")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", deletionLogId)
  }

  return { success: true, filesRemoved }
}

/**
 * Legacy entry point for the NON-admin flows (self-service, invite token,
 * retention jobs), which have no admin session and still import this name.
 * @deprecated Move those callers to `delete-user.composition.ts`
 * (`deleteUserCompletely` there) and delete this wrapper; it is the last
 * place in this file that creates a service-role client.
 */
export async function deleteUserCompletely(
  userId: string,
  options: { source: DeletionSource; campaign?: string }
): Promise<DeleteUserResult> {
  ensureServerSide()
  return deleteUserWithClient(createServiceRoleClient() as SupabaseClient<Database>, userId, options)
}

export interface AdminDeleteUserDeps {
  /** Client da sessão do chamador: só serve para `assertAdmin`. */
  session: SupabaseClient<Database>
  /** Apaga a conta; cria o client privilegiado só quando chamado (depois do `assertAdmin`). */
  deleteUser: (userId: string, options: { source: DeletionSource }) => Promise<DeleteUserResult>
}

/**
 * Remoção de conta pelo painel admin. Confere `assertAdmin` com a SESSÃO antes
 * de qualquer client privilegiado existir e não deixa o admin apagar a si mesmo.
 * @throws {AdminForbiddenError} quando a sessão não é de admin.
 * @throws {AdminSelfActionError} quando o alvo é o próprio admin.
 */
export function createAdminDeleteUser(deps: AdminDeleteUserDeps) {
  return async function deleteUserAsAdmin(actorId: string, targetId: string): Promise<DeleteUserResult> {
    await assertAdmin(deps.session)
    if (actorId === targetId) {
      throw new AdminSelfActionError("Você não pode remover a própria conta de administrador")
    }
    return deps.deleteUser(targetId, { source: "admin" })
  }
}
