import { createServiceRoleClient, ensureServerSide } from "@/lib/utils/supabase/service-role"
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
 * Runs with the service-role client because deleting from `auth.users`
 * requires the Admin API (there is no user-facing equivalent) - the
 * caller must already be authorized (`requireAdmin()` for the admin
 * path, a validated invite token for the self-service path). See
 * docs/domains/reengagement-invites.md §3.3 for why this is a deliberate,
 * scoped exception to the "never use service_role as a shortcut" rule in
 * AGENTS.md rather than a violation of it.
 */
export async function deleteUserCompletely(
  userId: string,
  options: { source: DeletionSource; campaign?: string }
): Promise<DeleteUserResult> {
  ensureServerSide()
  const supabase = createServiceRoleClient()

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
