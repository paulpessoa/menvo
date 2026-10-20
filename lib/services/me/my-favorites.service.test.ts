import { createMyFavoritesService } from "./my-favorites.service"

const MENTOR = "6f1c2a4e-1b2c-4d3e-9f00-0123456789ab"

const repo = () => ({
  listMentorIds: jest.fn(async () => [MENTOR]),
  add: jest.fn(async () => undefined),
  remove: jest.fn(async () => undefined),
})

describe("my favorites service", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined)
  })

  it("lists the mentor ids", async () => {
    expect(await createMyFavoritesService({ repo: repo() }).list("u1")).toEqual({ kind: "ok", mentorIds: [MENTOR] })
  })

  it("add inserts and remove deletes, always for the given user", async () => {
    const r = repo()
    const service = createMyFavoritesService({ repo: r })
    expect(await service.toggle("u1", { mentorId: MENTOR, action: "add" })).toEqual({ kind: "ok" })
    expect(r.add).toHaveBeenCalledWith("u1", MENTOR)
    expect(r.remove).not.toHaveBeenCalled()

    await service.toggle("u1", { mentorId: MENTOR, action: "remove" })
    expect(r.remove).toHaveBeenCalledWith("u1", MENTOR)
  })

  it("turns repository errors into a failed outcome", async () => {
    const r = repo()
    r.listMentorIds.mockRejectedValue(new Error("db"))
    r.add.mockRejectedValue(new Error("duplicate"))
    const service = createMyFavoritesService({ repo: r })
    expect(await service.list("u1")).toEqual({ kind: "failed" })
    expect(await service.toggle("u1", { mentorId: MENTOR, action: "add" })).toEqual({ kind: "failed" })
  })
})
