/**
 * @jest-environment node
 *
 * Camada 14 · Teste da auditoria de escrita por agentes.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import { z } from "zod"
import { defineCapability } from "./define"
import { runCapability } from "./run"

function setup(effect: "read" | "write", handler: () => unknown) {
  const insert = jest.fn().mockResolvedValue({ error: null })
  const supabase = { from: jest.fn(() => ({ insert })) } as unknown as SupabaseClient
  const capability = defineCapability({
    name: "test.action",
    toolName: "testAction",
    title: "t",
    description: "d",
    input: z.object({}),
    audience: ["authenticated"],
    effect,
    confirmation: "none",
    handler: async () => handler()
  })
  return { insert, supabase, capability }
}

const actor = { id: "u1", role: "mentee" as const }

describe("runCapability", () => {
  it("não audita leitura", async () => {
    const { insert, supabase, capability } = setup("read", () => "ok")
    await runCapability(capability, {}, { supabase, actor, surface: "assistant" })
    expect(insert).not.toHaveBeenCalled()
  })

  it("audita escrita com ator, superfície e capability, sem input", async () => {
    const { insert, supabase, capability } = setup("write", () => "ok")
    await runCapability(capability, {}, { supabase, actor, surface: "assistant" })
    expect(insert).toHaveBeenCalledWith({
      actor_id: "u1",
      surface: "assistant",
      capability: "test.action",
      effect: "write",
      outcome: "ok"
    })
  })

  it("audita erro e repassa a exceção", async () => {
    const { insert, supabase, capability } = setup("write", () => {
      throw new Error("boom")
    })
    await expect(
      runCapability(capability, {}, { supabase, actor, surface: "assistant" })
    ).rejects.toThrow("boom")
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ outcome: "error" }))
  })

  it("falha de auditoria não derruba a ação", async () => {
    const { insert, supabase, capability } = setup("write", () => "ok")
    insert.mockRejectedValue(new Error("db down"))
    jest.spyOn(console, "error").mockImplementation(() => {})
    await expect(
      runCapability(capability, {}, { supabase, actor, surface: "assistant" })
    ).resolves.toBe("ok")
  })
})
