import { renderHook, act } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300))
    expect(result.current).toBe('initial')
  })

  it('should update debounced value after specified delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    )

    rerender({ value: 'updated', delay: 300 })
    expect(result.current).toBe('initial')

    act(() => {
      jest.advanceTimersByTime(299)
    })
    expect(result.current).toBe('initial')

    act(() => {
      jest.advanceTimersByTime(1)
    })
    expect(result.current).toBe('updated')
  })

  it('should debounce rapid sequential updates and only apply the latest value', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 350 } }
    )

    rerender({ value: 'second', delay: 350 })
    act(() => {
      jest.advanceTimersByTime(100)
    })

    rerender({ value: 'third', delay: 350 })
    act(() => {
      jest.advanceTimersByTime(100)
    })

    rerender({ value: 'fourth', delay: 350 })
    expect(result.current).toBe('first')

    act(() => {
      jest.advanceTimersByTime(349)
    })
    expect(result.current).toBe('first')

    act(() => {
      jest.advanceTimersByTime(1)
    })
    expect(result.current).toBe('fourth')
  })

  it('should default to 300ms delay when not specified', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'default-test' } }
    )

    rerender({ value: 'default-changed' })

    act(() => {
      jest.advanceTimersByTime(299)
    })
    expect(result.current).toBe('default-test')

    act(() => {
      jest.advanceTimersByTime(1)
    })
    expect(result.current).toBe('default-changed')
  })
})
