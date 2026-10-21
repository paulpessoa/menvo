import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/supabase"
import { buildChatInboxService } from "./chat-inbox.composition"

const ME = "me"

interface Conv {
  id: string
  mentor_id: string
  mentee_id: string
  mentor: unknown
  mentee: unknown
}

function peer(id: string, name: string | null, roles: string[] = []) {
  return { id, full_name: name, avatar_url: null, user_roles: roles.map((r) => ({ roles: { name: r } })) }
}

/** Conversas em que `ME` é o mentorado e o outro é um mentor distinto. */
function makeConvs(n: number): Conv[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `c${i}`,
    mentor_id: `m${i}`,
    mentee_id: ME,
    last_message_at: null,
    created_at: "2026-01-01T00:00:00Z",
    mentor: peer(`m${i}`, `Mentor ${i}`, ["mentee", "mentor"]),
    mentee: peer(ME, "Eu"),
  })) as Conv[]
}

/**
 * Client falso que conta cada `from()`: cada `from()` = uma ida ao banco.
 * Todo método de filtro devolve o próprio builder, que é "thenable".
 */
function fakeDb(convs: Conv[], unread: string[], failTable?: string) {
  const calls: string[] = []
  const db = {
    from(table: string) {
      calls.push(table)
      const result = (() => {
        if (table === failTable) return { data: null, error: { message: "boom" }, count: null }
        if (table === "conversations") return { data: convs, error: null, count: null }
        return { data: unread.map((conversation_id) => ({ conversation_id })), error: null, count: unread.length }
      })()
      const builder: Record<string, unknown> = {}
      for (const m of ["select", "or", "order", "in", "neq", "is"]) builder[m] = () => builder
      builder.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
      return builder
    },
  }
  return { db: db as unknown as SupabaseClient<Database>, calls }
}

describe("chat inbox service", () => {
  it("runs a fixed number of queries no matter how many conversations (no N+1)", async () => {
    for (const n of [1, 5, 40]) {
      const { db, calls } = fakeDb(makeConvs(n), [])
      const items = await buildChatInboxService(db).getConversations(ME)
      expect(items).toHaveLength(n)
      expect(calls).toEqual(["conversations", "messages"])
    }
  })

  it("does not touch messages when there are no conversations", async () => {
    const { db, calls } = fakeDb([], [])
    expect(await buildChatInboxService(db).getConversations(ME)).toEqual([])
    expect(calls).toEqual(["conversations"])
  })

  it("groups unread messages per conversation and picks the other participant", async () => {
    const { db } = fakeDb(makeConvs(3), ["c0", "c0", "c2"])
    const items = await buildChatInboxService(db).getConversations(ME)
    expect(items.map((i) => i.unread_count)).toEqual([2, 0, 1])
    expect(items[0].other_user).toEqual({ id: "m0", full_name: "Mentor 0", avatar_url: null, role_name: "mentor" })
  })

  it("falls back to a generic name and the mentee role when the profile is missing", async () => {
    const convs = makeConvs(1)
    convs[0].mentor = null
    const { db } = fakeDb(convs, [])
    const [item] = await buildChatInboxService(db).getConversations(ME)
    expect(item.other_user).toMatchObject({ full_name: "Usuário", role_name: "mentee" })
  })

  it("ranks admin above mentor", async () => {
    const convs = makeConvs(1)
    convs[0].mentor = peer("m0", "Ada", ["mentor", "admin"])
    const { db } = fakeDb(convs, [])
    const [item] = await buildChatInboxService(db).getConversations(ME)
    expect(item.other_user.role_name).toBe("admin")
  })

  it("skips conversations where both sides are the caller", async () => {
    const convs = makeConvs(1)
    convs[0].mentor_id = ME
    const { db } = fakeDb(convs, [])
    expect(await buildChatInboxService(db).getConversations(ME)).toEqual([])
  })

  it("counts unread with 2 queries and returns 0 without conversations", async () => {
    const withConvs = fakeDb(makeConvs(3), ["c0", "c1"])
    expect(await buildChatInboxService(withConvs.db).getUnreadCount(ME)).toBe(2)
    expect(withConvs.calls).toEqual(["conversations", "messages"])

    const empty = fakeDb([], [])
    expect(await buildChatInboxService(empty.db).getUnreadCount(ME)).toBe(0)
    expect(empty.calls).toEqual(["conversations"])
  })

  it("surfaces repository errors", async () => {
    const { db } = fakeDb(makeConvs(1), [], "conversations")
    await expect(buildChatInboxService(db).getConversations(ME)).rejects.toThrow("chat.listConversationsWithPeers")
  })
})
