/**
 * @jest-environment node
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { AdminForbiddenError } from "@/lib/services/admin/assert-admin"
import { createMentorVerificationService, VerificationProfileNotFoundError } from "./notification.service"

const ROLES = [
  { id: 1, name: "mentee" },
  { id: 2, name: "mentor" },
]

function setup({ isAdmin = true as boolean | "error", profile = { id: "mentor-1", email: "mentor@x.com", full_name: "Mentor Um" } as unknown } = {}) {
  const calls: string[] = []
  const track = <T,>(name: string, value: T) =>
    jest.fn(async (..._args: unknown[]) => {
      calls.push(name)
      return value
    })

  const session = {
    rpc: jest.fn(async () =>
      isAdmin === "error" ? { data: null, error: { message: "rpc down" } } : { data: isAdmin, error: null }
    ),
  } as unknown as SupabaseClient<Database>

  const decisions = {
    updateProfile: track("profile", profile as { id: string; email: string; full_name: string | null } | null),
    upsertDecision: track("decision", undefined),
  }
  const roles = { findByNames: jest.fn(async () => ROLES) }
  const userRoles = { remove: track("role-remove", undefined), addIfMissing: track("role-add", true) }
  const messenger = { send: track("chat", undefined) }
  const mailer = { send: track("email", undefined) }
  const audit = track("audit", undefined)

  const service = createMentorVerificationService({ session, decisions, roles, userRoles, messenger, mailer, audit })
  return { service, calls, session, decisions, roles, userRoles, messenger, mailer, audit }
}

describe("processVerification", () => {
  it.each([false, "error" as const])("refuses a non-admin (%s) before touching any write", async (who) => {
    const t = setup({ isAdmin: who })
    await expect(
      t.service.processVerification({ userId: "mentor-1", adminId: "admin-1", status: "approved" })
    ).rejects.toBeInstanceOf(AdminForbiddenError)

    expect(t.calls).toEqual([])
  })

  it("runs in order: profile, decision, role, audit, chat, e-mail", async () => {
    const t = setup()
    await t.service.processVerification({ userId: "mentor-1", adminId: "admin-1", status: "approved", notes: "ok" })

    expect(t.calls).toEqual(["profile", "decision", "role-remove", "role-add", "audit", "chat", "email"])
  })

  it("assigns the mentor RBAC role and drops mentee when approved", async () => {
    // Regression test: approving a pending mentor request used to only
    // update `profiles` columns. isMentor is derived from user_roles
    // everywhere in the app (dashboard routing, availability setup, the
    // public mentors directory), so an "approved" mentor from this flow
    // was never actually recognized as a mentor anywhere.
    const t = setup()
    await t.service.processVerification({ userId: "mentor-1", adminId: "admin-1", status: "approved", notes: "ok" })

    expect(t.roles.findByNames).toHaveBeenCalledWith(["mentor", "mentee"])
    expect(t.userRoles.remove).toHaveBeenCalledWith("mentor-1", [1])
    expect(t.userRoles.addIfMissing).toHaveBeenCalledWith("mentor-1", 2)
  })

  it("does not touch user_roles when rejected or when changes are requested", async () => {
    const t = setup()
    await t.service.processVerification({ userId: "mentor-1", adminId: "admin-1", status: "rejected", notes: "incompleto" })
    await t.service.processVerification({ userId: "mentor-1", adminId: "admin-1", status: "changes_requested", notes: "bio" })

    expect(t.roles.findByNames).not.toHaveBeenCalled()
    expect(t.userRoles.remove).not.toHaveBeenCalled()
    expect(t.userRoles.addIfMissing).not.toHaveBeenCalled()
  })

  it("publishes the profile on approval and records the decision", async () => {
    // Regression test: the profile used to be updated with the admin's own
    // session, and `profiles` has no admin UPDATE policy - RLS matched zero
    // rows without an error, so the approval "succeeded" but the profile
    // stayed pending and hidden from /mentors (Bianca Dias, 2026-09-25).
    const t = setup()
    await t.service.processVerification({ userId: "mentor-1", adminId: "admin-1", status: "approved" })

    expect(t.decisions.updateProfile).toHaveBeenCalledWith("mentor-1", expect.objectContaining({ is_public: true }))
    expect(t.decisions.upsertDecision).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "mentor-1", verification_status: "approved", verified_at: expect.any(String) })
    )
  })

  it("records a rejection with the admin notes and keeps the profile hidden", async () => {
    const t = setup()
    await t.service.processVerification({ userId: "mentor-1", adminId: "admin-1", status: "rejected", notes: "foto" })

    expect((t.decisions.updateProfile.mock.calls[0] as unknown[])[1]).not.toHaveProperty("is_public")
    expect(t.decisions.upsertDecision).toHaveBeenCalledWith({
      user_id: "mentor-1",
      verification_status: "rejected",
      verification_notes: "foto",
      verified_at: null,
    })
  })

  it("throws a not-found error when no profile row was updated and sends nothing", async () => {
    const t = setup({ profile: null })
    await expect(
      t.service.processVerification({ userId: "ghost", adminId: "admin-1", status: "approved" })
    ).rejects.toBeInstanceOf(VerificationProfileNotFoundError)

    expect(t.calls).toEqual(["profile"])
  })

  it("audits the decision as the admin, with the target and no secrets", async () => {
    const t = setup()
    const request = new Request("http://localhost/api/admin/verify")
    await t.service.processVerification({ userId: "mentor-1", adminId: "admin-1", status: "rejected", notes: "interno", request })

    expect(t.audit).toHaveBeenCalledWith(
      "admin-1",
      "user_status_changed",
      { reason: "mentor_verification", verification_status: "rejected" },
      "mentor-1",
      "mentor@x.com",
      request
    )
  })

  it("sends the e-mail by default and skips it when notifyEmail is false", async () => {
    const t = setup()
    await t.service.processVerification({ userId: "mentor-1", adminId: "admin-1", status: "rejected", notes: "foto" })
    expect(t.mailer.send).toHaveBeenCalledWith(
      expect.objectContaining({ userEmail: "mentor@x.com", status: "rejected", notes: "foto" })
    )

    t.mailer.send.mockClear()
    await t.service.processVerification({ userId: "mentor-1", adminId: "admin-1", status: "approved", notifyEmail: false })
    expect(t.mailer.send).not.toHaveBeenCalled()
  })

  it("sends the admin-written message verbatim instead of the default text", async () => {
    const t = setup()
    await t.service.processVerification({
      userId: "mentor-1",
      adminId: "admin-1",
      status: "approved",
      notes: "interno",
      message: "Oi, Bianca! Seu perfil foi aprovado.",
    })

    expect(t.messenger.send).toHaveBeenCalledWith("mentor-1", "admin-1", "Oi, Bianca! Seu perfil foi aprovado.")
  })

  it("builds the default chat text and appends the admin notes", async () => {
    const t = setup()
    await t.service.processVerification({ userId: "mentor-1", adminId: "admin-1", status: "changes_requested", notes: "ajustar bio" })

    const content = (t.messenger.send.mock.calls[0] as unknown[])[2] as string
    expect(content).toContain("precisamos de alguns ajustes")
    expect(content).toContain("Notas do administrador:\najustar bio")
  })

  it("keeps the decision when the chat or the e-mail fails, reporting what went out", async () => {
    const t = setup()
    jest.spyOn(console, "error").mockImplementation(() => undefined)
    t.messenger.send.mockRejectedValueOnce(new Error("chat down"))
    t.mailer.send.mockRejectedValueOnce(new Error("brevo down"))

    const result = await t.service.processVerification({ userId: "mentor-1", adminId: "admin-1", status: "approved" })

    expect(result).toEqual({ success: true, chatSent: false, emailSent: false })
  })

  it("fails loudly when the role write fails, after the decision was stored", async () => {
    const t = setup()
    t.userRoles.addIfMissing.mockRejectedValueOnce(new Error("rls"))

    await expect(
      t.service.processVerification({ userId: "mentor-1", adminId: "admin-1", status: "approved" })
    ).rejects.toThrow("rls")
    expect(t.decisions.upsertDecision).toHaveBeenCalled()
    expect(t.messenger.send).not.toHaveBeenCalled()
  })
})
