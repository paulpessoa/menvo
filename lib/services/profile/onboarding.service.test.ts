import { ProfileRepositoryError } from "@/lib/repositories/profile.repository"
import { createOnboardingService } from "./onboarding.service"

function repo(initial: Record<string, unknown> = {}) {
  return {
    findOnboardingFlags: jest.fn(async () => initial as never),
    setOnboardingFlags: jest.fn(async () => undefined),
  }
}

describe("onboarding service", () => {
  it("adds the flag to the ones already stored", async () => {
    const r = repo({ ob_m1: "2026-10-01T00:00:00.000Z" })
    const outcome = await createOnboardingService({ repo: r }).markSeen("u1", { flag: "ob_m2", value: "2026-10-19" })
    expect(outcome).toEqual({ kind: "ok", flags: { ob_m1: "2026-10-01T00:00:00.000Z", ob_m2: "2026-10-19" } })
    expect(r.setOnboardingFlags).toHaveBeenCalledWith("u1", { ob_m1: "2026-10-01T00:00:00.000Z", ob_m2: "2026-10-19" })
  })

  it("overwrites an existing flag", async () => {
    const r = repo({ ob_m1: false })
    const outcome = await createOnboardingService({ repo: r }).markSeen("u1", { flag: "ob_m1", value: true })
    expect(outcome).toEqual({ kind: "ok", flags: { ob_m1: true } })
  })

  it("does not overwrite the other flags when reading them fails", async () => {
    const r = repo()
    r.findOnboardingFlags.mockRejectedValue(new ProfileRepositoryError("read", { message: "db down" }))
    const outcome = await createOnboardingService({ repo: r }).markSeen("u1", { flag: "ob_m1", value: true })
    expect(outcome).toEqual({ kind: "failed", message: "db down" })
    expect(r.setOnboardingFlags).not.toHaveBeenCalled()
  })

  it("clears every flag", async () => {
    const r = repo({ ob_m1: true })
    expect(await createOnboardingService({ repo: r }).clear("u1")).toEqual({ kind: "ok", flags: {} })
    expect(r.setOnboardingFlags).toHaveBeenCalledWith("u1", {})
  })

  it("reports the database message when the write fails", async () => {
    const r = repo()
    r.setOnboardingFlags.mockRejectedValue(new ProfileRepositoryError("write", { message: "denied" }))
    expect(await createOnboardingService({ repo: r }).clear("u1")).toEqual({ kind: "failed", message: "denied" })
  })
})
