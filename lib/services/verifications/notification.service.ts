/**
 * Camada 7 · Service (decisão da candidatura de mentor)
 * Regra: o único lugar em que uma candidatura é decidida, usado pela fila em
 * /dashboard/admin/verifications e pelo modal em /dashboard/admin/users (ambos
 * via POST /api/admin/verify), para que as duas telas produzam o mesmo estado de
 * perfil, papel RBAC, mensagem e e-mail. Confere `assertAdmin` com a SESSÃO
 * antes de tocar no client privilegiado (ADR 0008 §2.3, ADR 0009) e grava a
 * decisão na auditoria. A ordem é a de sempre e o teste a protege: perfil,
 * decisão, papel, mensagem, e-mail.
 * Não faz: HTTP, criar client (composition) nem escolher a implementação do
 * chat e do e-mail (chegam como ports).
 * Tradeoff: perfil e papel são escritas separadas (não atômicas): se o papel
 * falhar, a decisão já gravada fica e a chamada devolve erro; repetir é seguro
 * (papel é "checar e inserir"). Chat e e-mail só logam a falha: a decisão não
 * volta atrás por causa de um aviso.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database, TablesUpdate } from "@/lib/types/supabase"
import type { AdminMentorDecisionWriter } from "@/lib/repositories/admin-mentor-verification.repository"
import type { RolesCatalog, UserRolesRepository } from "@/lib/repositories/user-roles.repository"
import type { logAdminAction } from "@/lib/audit-logger"
import { assertAdmin } from "@/lib/services/admin/assert-admin"

export type VerificationStatus = "approved" | "rejected" | "pending" | "changes_requested"

export interface VerificationOptions {
  userId: string
  adminId: string
  status: VerificationStatus
  notes?: string
  /** Full chat message written by the admin (e.g. an edited AI draft); replaces the default text. */
  message?: string
  /** Also send the Brevo e-mail (default true). Only applies to approved/rejected. */
  notifyEmail?: boolean
  /** Só para registrar IP e user-agent na auditoria. */
  request?: Request
}

export interface VerificationResult {
  success: true
  chatSent: boolean
  emailSent: boolean
}

/** O perfil a decidir não existe (a rota responde 404). */
export class VerificationProfileNotFoundError extends Error {
  readonly status = 404

  constructor() {
    super("Perfil não encontrado")
    this.name = "VerificationProfileNotFoundError"
  }
}

/** Aviso dentro do chat, enviado pela sessão do admin para aparecer como ele. */
export interface VerificationMessenger {
  send(userId: string, adminId: string, content: string): Promise<void>
}

/** Aviso por e-mail (Brevo). */
export interface VerificationMailer {
  send(input: { userEmail: string; userName: string; status: VerificationStatus; notes?: string }): Promise<void>
}

export interface MentorVerificationServiceDeps {
  /** Client da sessão do chamador: só serve para `assertAdmin` (nunca o privilegiado). */
  session: SupabaseClient<Database>
  /** Escrita privilegiada de `profiles` e `mentor_profiles` (E7). */
  decisions: AdminMentorDecisionWriter
  /** Catálogo de papéis, lido pela sessão. */
  roles: RolesCatalog
  /** Escrita privilegiada de `user_roles` (ADR 0008, E2). */
  userRoles: UserRolesRepository
  messenger: VerificationMessenger
  mailer: VerificationMailer
  /** Trilha de auditoria; nunca lança. */
  audit: typeof logAdminAction
}

/**
 * `mentor_profiles` columns written for each decision. `verification_status`
 * is the single source of truth; `verified`/`is_pending_mentor` are derived
 * from it in `mentors_view` and `withMentorFields`.
 */
function buildMentorUpdate(userId: string, status: VerificationStatus, notes?: string) {
  return {
    user_id: userId,
    verification_status: status,
    verification_notes: notes ?? null,
    verified_at: status === "approved" ? new Date().toISOString() : null,
  }
}

/**
 * Approval also publishes the profile (`is_public`): the mentor directory only
 * lists public profiles, and the approval message tells the mentor they are
 * already listed. The mentor can hide it again from their own profile page.
 */
function buildProfileUpdate(status: VerificationStatus): TablesUpdate<"profiles"> {
  const base = { updated_at: new Date().toISOString() }
  return status === "approved" ? { ...base, is_public: true } : base
}

function defaultMessage(status: VerificationStatus, notes?: string): string {
  let content: string
  if (status === "approved") {
    content = "🎉 Parabéns! Seu perfil foi verificado e aprovado. Agora você já pode ser encontrado na plataforma Menvo."
  } else if (status === "changes_requested") {
    content = "📢 Olá! Analisamos seu perfil e precisamos de alguns ajustes antes da aprovação definitiva."
  } else {
    content = "Olá. Agradecemos seu interesse em mentorar na Menvo, mas no momento sua solicitação não foi aprovada."
  }
  return notes ? `${content}\n\nNotas do administrador:\n${notes}` : content
}

export function createMentorVerificationService(deps: MentorVerificationServiceDeps) {
  /**
   * Approval grants the RBAC "mentor" role. isMentor, the dashboard and
   * `mentors_view` (the public directory) all read user_roles, not profile
   * columns. mentor/mentee are exclusive (see /api/profile/role).
   */
  async function grantMentorRole(userId: string): Promise<void> {
    const roles = await deps.roles.findByNames(["mentor", "mentee"])
    const mentorRoleId = roles.find((r) => r.name === "mentor")?.id
    const menteeRoleId = roles.find((r) => r.name === "mentee")?.id

    if (menteeRoleId !== undefined) await deps.userRoles.remove(userId, [menteeRoleId])
    if (mentorRoleId !== undefined) await deps.userRoles.addIfMissing(userId, mentorRoleId)
  }

  return {
    /**
     * Decide a candidatura: perfil, decisão em `mentor_profiles`, papel (só na
     * aprovação), mensagem no chat e e-mail, nessa ordem.
     * @throws {AdminForbiddenError} quando a sessão não é de admin.
     * @throws {VerificationProfileNotFoundError} quando o perfil não existe.
     */
    async processVerification({
      userId,
      adminId,
      status,
      notes,
      message,
      notifyEmail = true,
      request,
    }: VerificationOptions): Promise<VerificationResult> {
      await assertAdmin(deps.session)

      // 1. Update profile - and fail loudly if no row was touched.
      const updated = await deps.decisions.updateProfile(userId, buildProfileUpdate(status))
      if (!updated) throw new VerificationProfileNotFoundError()

      // 2. The decision itself lives in mentor_profiles (users have no grant on it).
      await deps.decisions.upsertDecision(buildMentorUpdate(userId, status, notes))

      // 3. Role.
      if (status === "approved") await grantMentorRole(userId)

      await deps.audit(
        adminId,
        "user_status_changed",
        { reason: "mentor_verification", verification_status: status },
        userId,
        updated.email ?? undefined,
        request
      )

      // 4. Chat message (sent from the admin's own session so it shows as them).
      let chatSent = false
      try {
        await deps.messenger.send(userId, adminId, message || defaultMessage(status, notes))
        chatSent = true
      } catch (chatError) {
        console.error("[VERIFICATION] Falha ao enviar mensagem no chat:", chatError)
      }

      // 5. E-mail (Brevo).
      let emailSent = false
      if (notifyEmail && status !== "pending" && updated.email) {
        try {
          await deps.mailer.send({
            userEmail: updated.email,
            userName: updated.full_name || "Mentor",
            status,
            notes: message || notes,
          })
          emailSent = true
        } catch (emailError) {
          console.error("[VERIFICATION] Falha ao enviar e-mail:", emailError)
        }
      }

      return { success: true, chatSent, emailSent }
    },
  }
}

export type MentorVerificationService = ReturnType<typeof createMentorVerificationService>
