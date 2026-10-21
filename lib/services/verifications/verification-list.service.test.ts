/**
 * @jest-environment node
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import type { MentorApplicationRow } from "@/lib/repositories/admin-mentor-verification.repository"
import { AdminForbiddenError } from "@/lib/services/admin/assert-admin"
import { createMentorVerificationListService } from "./verification-list.service"

const UID = "123e4567-e89b-42d3-a456-426614174000"

function row(overrides: Partial<MentorApplicationRow["profiles"]> = {}): MentorApplicationRow {
  return {
    user_id: UID,
    verification_status: "pending",
    mentorship_approach: "abordagem",
    what_to_expect: "espere",
    created_at: "2026-01-01",
    updated_at: "2026-02-01",
    profiles: {
      id: UID,
      email: "ana@x.com",
      full_name: "Ana Souza",
      first_name: "Ana",
      last_name: "Souza",
      job_title: "Dev",
      company: "Acme",
      bio: "bio",
      expertise_areas: ["tech"],
      linkedin_url: "https://linkedin.com/in/ana",
      created_at: "2025-12-01",
      ...overrides,
    },
  }
}

function setup(isAdmin: boolean | "error" = true) {
  const session = {
    rpc: jest.fn(async () =>
      isAdmin === "error" ? { data: null, error: { message: "rpc down" } } : { data: isAdmin, error: null }
    ),
  } as unknown as SupabaseClient<Database>
  const applications = { listByStatus: jest.fn(async () => [row()]) }
  const mentors = {
    listMentors: jest.fn(async () => [{ id: "m1" }, { id: "m2" }, { name: "sem id" }]),
    findEmails: jest.fn(async () => [{ id: "m1", email: "m1@x.com" }]),
  }
  const cv = { findStoredCvUrls: jest.fn(async () => [{ user_id: UID, cv_url: `${UID}/cv-1.pdf` }]) }
  return { applications, mentors, cv, service: createMentorVerificationListService({ session, applications, mentors, cv }) }
}

describe("mentor verification list service", () => {
  it.each([false, "error" as const])("refuses a non-admin (%s) before reading anything", async (who) => {
    const { service, applications, mentors, cv } = setup(who)
    await expect(service.listVerifications(["pending"])).rejects.toBeInstanceOf(AdminForbiddenError)
    await expect(service.listMentors()).rejects.toBeInstanceOf(AdminForbiddenError)
    expect(applications.listByStatus).not.toHaveBeenCalled()
    expect(mentors.listMentors).not.toHaveBeenCalled()
    expect(cv.findStoredCvUrls).not.toHaveBeenCalled()
  })

  it("maps the application to the screen shape with the Menvo CV link", async () => {
    const { service, applications, cv } = setup()
    const [item] = await service.listVerifications(["pending", "changes_requested"], { limit: 20 })

    expect(applications.listByStatus).toHaveBeenCalledWith(["pending", "changes_requested"], 20)
    expect(cv.findStoredCvUrls).toHaveBeenCalledWith([UID])
    expect(item).toMatchObject({
      id: UID,
      mentor_id: UID,
      mentor_name: "Ana Souza",
      mentor_email: "ana@x.com",
      mentor_title: "Dev",
      cv_url: `/api/cv/${UID}`,
      verification_type: "Identity",
      status: "pending",
      created_at: "2025-12-01",
      updated_at: "2026-02-01",
    })
  })

  it("defaults the limit to 100 and falls back for missing name, title and CV", async () => {
    const { service, applications, cv } = setup()
    applications.listByStatus.mockResolvedValue([row({ full_name: null, job_title: null, company: null, email: "" })])
    cv.findStoredCvUrls.mockResolvedValue([])

    const [item] = await service.listVerifications(["approved"])

    expect(applications.listByStatus).toHaveBeenCalledWith(["approved"], 100)
    expect(item).toMatchObject({ mentor_name: "Ana Souza", mentor_title: "Mentor", mentor_company: "", mentor_email: "", cv_url: null })
  })

  it("adds the e-mail from profiles to each mentor (null when missing)", async () => {
    const { service, mentors } = setup()
    const result = await service.listMentors()

    expect(mentors.findEmails).toHaveBeenCalledWith(["m1", "m2"])
    expect(result).toEqual([
      { id: "m1", email: "m1@x.com" },
      { id: "m2", email: null },
      { name: "sem id", email: null },
    ])
  })
})
