/**
 * @jest-environment node
 */
import { QueryClient } from "@tanstack/react-query"
import { qk } from "./keys"
import { effects, runEffects } from "./effects"

describe("profile and me keys", () => {
  it("the own profile sits under qk.profile.all", () => {
    expect(qk.profile.own("u1").slice(0, qk.profile.all.length)).toEqual([...qk.profile.all])
  })

  it("favorites and notifications sit under qk.me.all", () => {
    for (const key of [qk.me.favorites("u1"), qk.me.notifications("u1", "mentor")]) {
      expect(key.slice(0, qk.me.all.length)).toEqual([...qk.me.all])
    }
  })

  it("every key carries the user id, so accounts never share a cache", () => {
    expect(qk.profile.own("u1")).not.toEqual(qk.profile.own("u2"))
    expect(qk.me.favorites("u1")).not.toEqual(qk.me.favorites("u2"))
    expect(qk.me.notifications("u1")).not.toEqual(qk.me.notifications("u2"))
  })

  it("notifications are keyed by role, and a missing role equals null", () => {
    expect(qk.me.notifications("u1", "mentor")).not.toEqual(qk.me.notifications("u1", "mentee"))
    expect(qk.me.notifications("u1")).toEqual(qk.me.notifications("u1", null))
  })
})

describe("profile and me effects", () => {
  it("saving the profile makes the profile and the mentors catalog stale", () => {
    expect(effects["profile.update"]()).toEqual([qk.profile.all, ["mentors"]])
  })

  it("toggling a favorite only touches that user's favorites", () => {
    expect(effects["me.favorites.toggle"]({ userId: "u1" })).toEqual([qk.me.favorites("u1")])
  })

  it("runEffects invalidates each key", async () => {
    const qc = new QueryClient()
    const spy = jest.spyOn(qc, "invalidateQueries").mockResolvedValue()
    await runEffects(qc, effects["profile.update"]())
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
