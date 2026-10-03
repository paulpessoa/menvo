/**
 * @jest-environment node
 */
import { QueryClient } from "@tanstack/react-query"
import { qk } from "./keys"
import { effects, runEffects } from "./effects"
import { ApiClientError, getJson, postJson } from "./http"
import { z } from "zod"

describe("query keys", () => {
  it("every quiz key sits under qk.quiz.all, so invalidating the root reaches them", () => {
    const keys = [qk.quiz.latest("u1"), qk.quiz.result("q1"), qk.quiz.accountLink("q1")]
    for (const key of keys) expect(key.slice(0, qk.quiz.all.length)).toEqual([...qk.quiz.all])
  })

  it("the e-mail link token is never part of a key", () => {
    expect(JSON.stringify(qk.quiz.accountLink("q1"))).not.toMatch(/token|\bk\b/i)
  })

  it("slug keys ignore the order of the names", () => {
    expect(qk.mentors.slugs(["Bia", "Ana"])).toEqual(qk.mentors.slugs(["Ana", "Bia"]))
  })
})

describe("effects", () => {
  it("submitting a quiz invalidates everything under quiz", () => {
    expect(effects["quiz.submit"]()).toEqual([qk.quiz.all])
  })

  it("creating an account refreshes that result (is_owner) and the rest", () => {
    expect(effects["quiz.account.create"]({ quizId: "q1" })).toEqual([qk.quiz.result("q1"), qk.quiz.all])
  })

  it("runEffects invalidates each key on the client", async () => {
    const qc = new QueryClient()
    const spy = jest.spyOn(qc, "invalidateQueries").mockResolvedValue()
    await runEffects(qc, effects["quiz.submit"]())
    expect(spy).toHaveBeenCalledWith({ queryKey: qk.quiz.all })
  })
})

describe("http client", () => {
  const schema = z.object({ id: z.string() })
  const respond = (status: number, body: unknown) =>
    (global.fetch = jest.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body }) as never)

  it("parses a good response with the schema", async () => {
    respond(200, { id: "x", extra: "dropped" })
    expect(await getJson("/api/x", schema)).toEqual({ id: "x" })
  })

  it("a response outside the contract is an error, not undefined on screen", async () => {
    respond(200, { nope: true })
    await expect(getJson("/api/x", schema)).rejects.toThrow()
  })

  it("turns an error body into ApiClientError with status, code and body", async () => {
    respond(429, { error: "Muitas tentativas", code: "email_limit" })
    const error = await postJson("/api/x", {}, schema).catch((e) => e)
    expect(error).toBeInstanceOf(ApiClientError)
    expect(error).toMatchObject({ status: 429, message: "Muitas tentativas", code: "email_limit" })
  })

  it("keeps the raw body for routes that answer with more than an error (409 exists)", async () => {
    respond(409, { status: "exists", email: "a@b.co" })
    const error = (await postJson("/api/x", {}, schema).catch((e) => e)) as ApiClientError
    expect(error.status).toBe(409)
    expect(error.body?.status).toBe("exists")
  })

  it("sends JSON with the right header", async () => {
    respond(200, { id: "x" })
    await postJson("/api/x", { a: 1 }, schema)
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/x",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ a: 1 }), headers: { "Content-Type": "application/json" } })
    )
  })
})
