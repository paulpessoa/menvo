import { act, renderHook } from "@testing-library/react"
import { useMediaQuery } from "./useMediaQuery"

type Listener = () => void

function mockMatchMedia(initial: boolean) {
  let matches = initial
  const listeners = new Set<Listener>()
  window.matchMedia = jest.fn().mockImplementation(() => ({
    get matches() {
      return matches
    },
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    removeEventListener: (_: string, l: Listener) => listeners.delete(l),
  }))
  return {
    set(next: boolean) {
      matches = next
      listeners.forEach((l) => l())
    },
  }
}

describe("useMediaQuery", () => {
  it("returns the current match and follows changes", () => {
    const media = mockMatchMedia(true)
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"))
    expect(result.current).toBe(true)

    act(() => media.set(false))
    expect(result.current).toBe(false)
  })
})
