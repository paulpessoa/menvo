/**
 * @jest-environment node
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { AdminForbiddenError } from "./assert-admin"
import { createAdminRetentionService } from "./retention.service"

function setup(isAdmin: boolean) {
  const sessionDb = {
    rpc: jest.fn().mockResolvedValue({ data: isAdmin, error: null })
  } as unknown as SupabaseClient<Database>
  const reads = {
    listRetentionQueue: jest.fn().mockResolvedValue([
      { notice_30d_sent_at: null, notice_1d_sent_at: null, profile: { email_opt_out_at: null } },
      { notice_30d_sent_at: "x", notice_1d_sent_at: null, profile: { email_opt_out_at: null } },
      { notice_30d_sent_at: "x", notice_1d_sent_at: "y", profile: { email_opt_out_at: null } },
      { notice_30d_sent_at: "x", notice_1d_sent_at: "y", profile: { email_opt_out_at: "z" } }
    ]),
    listInactiveQueue: jest.fn().mockResolvedValue([
      { notice_30d_sent_at: null },
      { notice_30d_sent_at: "x" }
    ])
  }
  const writeRepo = {
    markAsNativeUser: jest.fn().mockResolvedValue(undefined),
    removeFromRetentionQueue: jest.fn().mockResolvedValue(undefined)
  }
  const writes = jest.fn(() => writeRepo)
  const audit = jest.fn().mockResolvedValue(undefined)
  const service = createAdminRetentionService({ sessionDb, reads, writes, audit })
  return { service, reads, writeRepo, writes, audit }
}

describe("getRetentionOverview", () => {
  it("counts each stage, opt-out first", async () => {
    const { service } = setup(true)
    const result = await service.getRetentionOverview()
    expect(result.stats).toEqual({ enrolled: 1, noticed30d: 1, noticed1d: 1, optedOut: 1 })
    expect(result.inactiveStats).toEqual({ enrolled: 1, noticed30d: 1 })
  })

  it("refuses a non-admin before reading anything", async () => {
    const { service, reads } = setup(false)
    await expect(service.getRetentionOverview()).rejects.toBeInstanceOf(AdminForbiddenError)
    expect(reads.listRetentionQueue).not.toHaveBeenCalled()
  })
})

describe("exemptFromRetention", () => {
  it("flips the origin, leaves the queue and audits, in that order", async () => {
    const { service, writeRepo, audit } = setup(true)
    await service.exemptFromRetention("admin-1", "user-1")
    expect(writeRepo.markAsNativeUser).toHaveBeenCalledWith("user-1")
    expect(writeRepo.removeFromRetentionQueue).toHaveBeenCalledWith("user-1")
    expect(audit).toHaveBeenCalledWith("admin-1", { reason: "retention_exempt" }, "user-1")
  })

  it("refuses a non-admin without ever creating the privileged client", async () => {
    const { service, writes, audit } = setup(false)
    await expect(service.exemptFromRetention("u", "user-1")).rejects.toBeInstanceOf(AdminForbiddenError)
    expect(writes).not.toHaveBeenCalled()
    expect(audit).not.toHaveBeenCalled()
  })
})
