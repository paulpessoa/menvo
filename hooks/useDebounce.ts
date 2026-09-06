import { useState, useEffect } from "react"

/**
 * Hook to debounce a value by a specified delay in milliseconds.
 * Prevents excessive calculations, API calls, and render thrashing on fast keystrokes.
 *
 * @param value The raw input value to debounce
 * @param delay Milliseconds to wait before committing value change (defaults to 300ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
