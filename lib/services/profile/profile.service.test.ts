import {
  ProfileRepositoryError,
  type OwnProfileRow,
  type ProfileRepository,
} from "@/lib/repositories/profile.repository"
import { createProfileService } from "./profile.service"

const NOW = new Date("2026-10-19T12:00:00.000Z")

const row = (extra: Record<string, unknown> = {}): OwnProfileRow => ({
  id: "u1",
  is_public: true,
  first_name: "Ana",
  mentor_profiles: { verification_status: "approved", chat_enabled: true },
  mentee_profiles: { course: "BCC", cv_url: "u1/cv.pdf" },
  ...extra,
})

/** Repository falso que registra a ordem das chamadas. */
function fakeRepo(overrides: Partial<ProfileRepository> = {}) {
  const calls: string[] = []
  const repo: ProfileRepository = {
    findOwn: jest.fn(async () => {
      calls.push("findOwn")
      return row()
    }),
    insertOwn: jest.fn(async p => {
      calls.push("insertOwn")
      return row({ ...p, mentor_profiles: null, mentee_profiles: null })
    }),
    updateProfile: jest.fn(async () => void calls.push("updateProfile")),
    updateMentorFields: jest.fn(async () => void calls.push("updateMentorFields")),
    upsertMenteeFields: jest.fn(async () => void calls.push("upsertMenteeFields")),
    ...overrides,
  }
  return { repo, calls }
}

const service = (repo: ProfileRepository) => createProfileService({ repo, now: () => NOW })

describe("profile service: getOwn", () => {
  it("returns the flattened profile with is_public and the CV link", async () => {
    const { repo } = fakeRepo()
    const outcome = await service(repo).getOwn({ id: "u1" })
    expect(outcome.kind).toBe("ok")
    if (outcome.kind !== "ok") return
    expect(outcome.profile).toMatchObject({
      id: "u1",
      is_public: true,
      verified: true,
      chat_enabled: true,
      course: "BCC",
    })
    expect(outcome.profile).not.toHaveProperty("mentor_profiles")
    expect(outcome.profile.cv_url).toContain("/api/cv/u1")
  })

  it("creates the row from the provider identity when it does not exist", async () => {
    const { repo } = fakeRepo({ findOwn: jest.fn(async () => null) })
    const outcome = await service(repo).getOwn({
      id: "u2",
      email: "m@example.com",
      user_metadata: { name: "Maria Silva", given_name: "Maria", family_name: "Silva" },
    })
    expect(repo.insertOwn).toHaveBeenCalledWith({
      id: "u2",
      email: "m@example.com",
      first_name: "Maria",
      last_name: "Silva",
    })
    expect(outcome.kind).toBe("ok")
  })

  it("reports which stage failed", async () => {
    const boom = new ProfileRepositoryError("x", { message: "db down" })
    const fetchFail = fakeRepo({ findOwn: jest.fn(async () => { throw boom }) })
    expect(await service(fetchFail.repo).getOwn({ id: "u1" })).toEqual({ kind: "failed", stage: "fetch", message: "db down" })

    const createFail = fakeRepo({
      findOwn: jest.fn(async () => null),
      insertOwn: jest.fn(async () => { throw boom }),
    })
    expect(await service(createFail.repo).getOwn({ id: "u1" })).toEqual({ kind: "failed", stage: "create", message: "db down" })
  })
})

describe("profile service: updateOwn", () => {
  it("saves profiles first, then mentor, then mentee, then reads the result", async () => {
    const { repo, calls } = fakeRepo()
    const outcome = await service(repo).updateOwn("u1", {
      is_public: false,
      bio: "Olá",
      chat_enabled: true,
      course: "BCC",
    })
    expect(calls).toEqual(["updateProfile", "updateMentorFields", "upsertMenteeFields", "findOwn"])
    expect(outcome.kind).toBe("ok")
  })

  it("splits the payload by destination table and stamps updated_at", async () => {
    const { repo } = fakeRepo()
    await service(repo).updateOwn("u1", { is_public: false, bio: "x", chat_enabled: true, course: "BCC" })
    expect(repo.updateProfile).toHaveBeenCalledWith("u1", {
      is_public: false,
      bio: "x",
      updated_at: NOW.toISOString(),
    })
    expect(repo.updateMentorFields).toHaveBeenCalledWith("u1", { chat_enabled: true })
    expect(repo.upsertMenteeFields).toHaveBeenCalledWith("u1", { course: "BCC" })
  })

  it("touches only the tables that have fields in the payload", async () => {
    const { repo } = fakeRepo()
    await service(repo).updateOwn("u1", { is_public: false })
    expect(repo.updateMentorFields).not.toHaveBeenCalled()
    expect(repo.upsertMenteeFields).not.toHaveBeenCalled()
  })

  it("a taken slug stops before mentor and mentee are written (partial save regression)", async () => {
    const { repo } = fakeRepo({
      updateProfile: jest.fn(async () => {
        throw new ProfileRepositoryError("p", { message: 'duplicate key value violates unique constraint "profiles_slug_key"', code: "23505" })
      }),
    })
    const outcome = await service(repo).updateOwn("u1", { slug: "ana", chat_enabled: true, course: "BCC" })
    expect(outcome).toEqual({ kind: "slug_taken" })
    expect(repo.updateMentorFields).not.toHaveBeenCalled()
    expect(repo.upsertMenteeFields).not.toHaveBeenCalled()
  })

  it("a unique violation on another column is a plain failure, not a slug error", async () => {
    const { repo } = fakeRepo({
      updateProfile: jest.fn(async () => {
        throw new ProfileRepositoryError("p", { message: "duplicate key ... profiles_email_key", code: "23505" })
      }),
    })
    const outcome = await service(repo).updateOwn("u1", { first_name: "Ana" })
    expect(outcome.kind).toBe("failed")
  })

  it("returns the database message when mentor fields fail", async () => {
    const { repo } = fakeRepo({
      updateMentorFields: jest.fn(async () => {
        throw new ProfileRepositoryError("m", { message: "permission denied" })
      }),
    })
    expect(await service(repo).updateOwn("u1", { chat_enabled: true })).toEqual({
      kind: "failed",
      message: "permission denied",
    })
  })

  it("the profile that comes back keeps is_public (regression of f95c9da5)", async () => {
    const { repo } = fakeRepo({ findOwn: jest.fn(async () => row({ is_public: false })) })
    const outcome = await service(repo).updateOwn("u1", { is_public: false })
    expect(outcome.kind === "ok" && outcome.profile.is_public).toBe(false)
  })
})
