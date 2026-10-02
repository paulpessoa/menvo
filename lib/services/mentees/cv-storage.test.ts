jest.mock("@/lib/utils/supabase/service-role", () => ({ createServiceRoleClient: jest.fn() }))

import { cvStoragePath } from "./cv-storage"

const UID = "0737122a-0579-4981-9802-41883d6563a3"

const OTHER = "11ee6e45-eb1c-49ed-9897-dcd592719279"

describe("cvStoragePath", () => {
  it("keeps the owner's uploaded path", () => {
    expect(cvStoragePath(`${UID}/cv-1700000000000.pdf`, UID)).toBe(`${UID}/cv-1700000000000.pdf`)
  })

  it("extracts the path from the legacy public URL", () => {
    const url = `https://x.supabase.co/storage/v1/object/public/cvs/${UID}/cv-1.pdf`
    expect(cvStoragePath(url, UID)).toBe(`${UID}/cv-1.pdf`)
  })

  it("accepts the owner's imported CV", () => {
    const url = `https://x.supabase.co/storage/v1/object/public/cvs/estagio-recife/${UID}_cv.pdf`
    expect(cvStoragePath(url, UID)).toBe(`estagio-recife/${UID}_cv.pdf`)
  })

  it("never returns someone else's file", () => {
    expect(cvStoragePath(`${OTHER}/cv-1.pdf`, UID)).toBeNull()
    expect(cvStoragePath(`estagio-recife/${OTHER}_cv.pdf`, UID)).toBeNull()
    expect(cvStoragePath(`${UID}/../${OTHER}/cv-1.pdf`, UID)).toBeNull()
  })

  it("rejects junk and empty values", () => {
    expect(cvStoragePath("teste", UID)).toBeNull()
    expect(cvStoragePath("", UID)).toBeNull()
    expect(cvStoragePath(null, UID)).toBeNull()
  })
})
