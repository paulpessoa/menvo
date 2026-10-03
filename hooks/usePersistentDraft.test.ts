import { renderHook, act } from "@testing-library/react"
import { z } from "zod"
import { clearDraft, readDraft, usePersistentDraft, writeDraft } from "./usePersistentDraft"

const schema = z.object({ step: z.number(), text: z.string() })
const KEY = "test:draft"

beforeEach(() => window.localStorage.clear())

describe("draft storage", () => {
  it("round-trips a valid draft", () => {
    writeDraft(KEY, 1, { step: 2, text: "oi" })
    expect(readDraft(KEY, schema, 1)).toEqual({ step: 2, text: "oi" })
  })

  it("discards a draft from another version", () => {
    writeDraft(KEY, 1, { step: 2, text: "oi" })
    expect(readDraft(KEY, schema, 2)).toBeNull()
  })

  it("discards a draft that no longer matches the schema, and corrupt JSON", () => {
    writeDraft(KEY, 1, { step: "dois" })
    expect(readDraft(KEY, schema, 1)).toBeNull()
    window.localStorage.setItem(KEY, "{not json")
    expect(readDraft(KEY, schema, 1)).toBeNull()
  })

  it("never throws when storage is blocked (private window, full quota)", () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota")
    })
    expect(readDraft(KEY, schema, 1)).toBeNull()
    expect(() => writeDraft(KEY, 1, {})).not.toThrow()
    jest.restoreAllMocks()
  })
})

describe("usePersistentDraft", () => {
  const isEmpty = (v: z.infer<typeof schema>) => v.text === ""

  it("restores once on mount", () => {
    writeDraft(KEY, 1, { step: 3, text: "salvo" })
    const { result } = renderHook(() => usePersistentDraft(KEY, schema, 1, isEmpty))
    expect(result.current.restored).toEqual({ step: 3, text: "salvo" })
  })

  it("saves a value, and deletes the draft when the value is empty", () => {
    const { result } = renderHook(() => usePersistentDraft(KEY, schema, 1, isEmpty))
    expect(result.current.restored).toBeNull()

    act(() => result.current.save({ step: 1, text: "algo" }))
    expect(readDraft(KEY, schema, 1)).toEqual({ step: 1, text: "algo" })

    act(() => result.current.save({ step: 1, text: "" }))
    expect(window.localStorage.getItem(KEY)).toBeNull()
  })

  it("clear removes the draft", () => {
    writeDraft(KEY, 1, { step: 1, text: "x" })
    const { result } = renderHook(() => usePersistentDraft(KEY, schema, 1, isEmpty))
    act(() => result.current.clear())
    expect(window.localStorage.getItem(KEY)).toBeNull()
    clearDraft(KEY)
  })
})
