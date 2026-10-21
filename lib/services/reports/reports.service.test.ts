import { createReport, isOwnEvidencePath, ReportsError, uploadEvidence } from "./reports.service"

const input = { category: "spam", description: "d", evidence_paths: [] as string[], reported_email: "" }

describe("isOwnEvidencePath", () => {
  it.each([
    ["u1/a.png", true],
    ["u2/a.png", false],
    ["u1/../u2/a.png", false],
    ["u1/sub/a.png", false],
    ["u1/", false],
    ["u10/a.png", false],
  ])("%s -> %s", (path, ok) => expect(isOwnEvidencePath("u1", path)).toBe(ok))
})

describe("createReport", () => {
  it("inserts with the session user and normalises empty reported_email", async () => {
    const repo = { insert: jest.fn().mockResolvedValue("r1") }
    await expect(createReport(repo, "u1", { ...input, evidence_paths: ["u1/a.png"] })).resolves.toBe("r1")
    expect(repo.insert).toHaveBeenCalledWith({
      reporterId: "u1", category: "spam", description: "d", evidencePaths: ["u1/a.png"], reportedEmail: null,
    })
  })

  it("rejects evidence from another user without inserting", async () => {
    const repo = { insert: jest.fn() }
    await expect(createReport(repo, "u1", { ...input, evidence_paths: ["u2/a.png"] })).rejects.toBeInstanceOf(ReportsError)
    expect(repo.insert).not.toHaveBeenCalled()
  })
})

describe("uploadEvidence", () => {
  const file = (type: string, size: number) => ({ type, size, bytes: async () => new Uint8Array(size) })

  it("stores under the user folder with a server-generated name", async () => {
    const storage = { upload: jest.fn().mockResolvedValue(undefined) }
    const path = await uploadEvidence(storage, "u1", file("image/png", 10))
    expect(path).toMatch(/^u1\/\d+_[0-9a-f-]{36}\.png$/)
    expect(storage.upload).toHaveBeenCalledWith(path, expect.any(Uint8Array), "image/png")
  })

  it.each([
    ["text/html", 10, "unsupported_type"],
    ["image/png", 0, "empty_file"],
    ["application/pdf", 5 * 1024 * 1024 + 1, "too_large"],
  ])("rejects %s (%i bytes)", async (type, size, code) => {
    const storage = { upload: jest.fn() }
    await expect(uploadEvidence(storage, "u1", file(type, size))).rejects.toMatchObject({ code })
    expect(storage.upload).not.toHaveBeenCalled()
  })
})
