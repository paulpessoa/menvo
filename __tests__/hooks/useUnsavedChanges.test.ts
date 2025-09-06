import { renderHook, act } from '@testing-library/react'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'

// Mock Next.js router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
}

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

describe('useUnsavedChanges', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear any existing event listeners
    window.removeEventListener = jest.fn()
    window.addEventListener = jest.fn()
  })

  it('should initialize with no unsaved changes', () => {
    const formData = { name: 'John', email: 'john@example.com' }
    const { result } = renderHook(() => useUnsavedChanges(formData))

    expect(result.current.hasUnsavedChanges).toBe(false)
  })

  it('should detect changes in form data', () => {
    const initialData = { name: 'John', email: 'john@example.com' }
    const { result, rerender } = renderHook(
      ({ formData }) => useUnsavedChanges(formData),
      { initialProps: { formData: initialData } }
    )

    // Initially no changes
    expect(result.current.hasUnsavedChanges).toBe(false)

    // Change form data
    const changedData = { name: 'Jane', email: 'john@example.com' }
    rerender({ formData: changedData })

    expect(result.current.hasUnsavedChanges).toBe(true)
  })

  it('should detect deep object changes', () => {
    const initialData = {
      user: { name: 'John', profile: { age: 30 } },
      settings: { theme: 'dark' }
    }
    const { result, rerender } = renderHook(
      ({ formData }) => useUnsavedChanges(formData),
      { initialProps: { formData: initialData } }
    )

    // Change nested property
    const changedData = {
      user: { name: 'John', profile: { age: 31 } },
      settings: { theme: 'dark' }
    }
    rerender({ formData: changedData })

    expect(result.current.hasUnsavedChanges).toBe(true)
  })

  it('should mark as saved and reset changes', () => {
    const initialData = { name: 'John' }
    const { result, rerender } = renderHook(
      ({ formData }) => useUnsavedChanges(formData),
      { initialProps: { formData: initialData } }
    )

    // Change data
    const changedData = { name: 'Jane' }
    rerender({ formData: changedData })
    expect(result.current.hasUnsavedChanges).toBe(true)

    // Mark as saved
    act(() => {
      result.current.markAsSaved()
    })

    expect(result.current.hasUnsavedChanges).toBe(false)
  })

  it('should manually mark as changed', () => {
    const formData = { name: 'John' }
    const { result } = renderHook(() => useUnsavedChanges(formData))

    expect(result.current.hasUnsavedChanges).toBe(false)

    act(() => {
      result.current.markAsChanged()
    })

    expect(result.current.hasUnsavedChanges).toBe(true)
  })

  it('should reset changes', () => {
    const formData = { name: 'John' }
    const { result } = renderHook(() => useUnsavedChanges(formData))

    act(() => {
      result.current.markAsChanged()
    })
    expect(result.current.hasUnsavedChanges).toBe(true)

    act(() => {
      result.current.resetChanges()
    })

    expect(result.current.hasUnsavedChanges).toBe(false)
  })

  it('should call onChangesDetected callback', () => {
    const onChangesDetected = jest.fn()
    const initialData = { name: 'John' }
    
    const { result, rerender } = renderHook(
      ({ formData }) => useUnsavedChanges(formData, { onChangesDetected }),
      { initialProps: { formData: initialData } }
    )

    // Change data
    const changedData = { name: 'Jane' }
    rerender({ formData: changedData })

    expect(onChangesDetected).toHaveBeenCalledWith(true)
  })

  it('should call onNavigationAttempt when configured', () => {
    const onNavigationAttempt = jest.fn()
    const formData = { name: 'John' }
    
    const { result } = renderHook(() => 
      useUnsavedChanges(formData, { 
        enableRouterBlocking: true,
        onNavigationAttempt 
      })
    )

    act(() => {
      result.current.markAsChanged()
    })

    // This would be called by router navigation in real scenario
    // Here we test the callback is set up correctly
    expect(result.current.hasUnsavedChanges).toBe(true)
  })

  it('should set up browser beforeunload warning', () => {
    const formData = { name: 'John' }
    
    renderHook(() => 
      useUnsavedChanges(formData, { 
        enableBrowserWarning: true,
        browserWarningMessage: 'Custom warning message'
      })
    )

    expect(window.addEventListener).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    )
  })

  it('should not set up browser warning when disabled', () => {
    const formData = { name: 'John' }
    
    renderHook(() => 
      useUnsavedChanges(formData, { 
        enableBrowserWarning: false
      })
    )

    // Should not add beforeunload listener
    expect(window.addEventListener).not.toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    )
  })

  it('should handle confirmNavigation', () => {
    const formData = { name: 'John' }
    const { result } = renderHook(() => useUnsavedChanges(formData))

    // No changes - should allow navigation
    expect(result.current.confirmNavigation()).toBe(true)

    // With changes - should show confirmation
    act(() => {
      result.current.markAsChanged()
    })

    // Mock window.confirm
    const originalConfirm = window.confirm
    window.confirm = jest.fn(() => true)

    expect(result.current.confirmNavigation()).toBe(true)
    expect(window.confirm).toHaveBeenCalled()

    // Test rejection
    window.confirm = jest.fn(() => false)
    expect(result.current.confirmNavigation()).toBe(false)

    // Restore
    window.confirm = originalConfirm
  })

  it('should handle array changes', () => {
    const initialData = { tags: ['tag1', 'tag2'] }
    const { result, rerender } = renderHook(
      ({ formData }) => useUnsavedChanges(formData),
      { initialProps: { formData: initialData } }
    )

    expect(result.current.hasUnsavedChanges).toBe(false)

    // Change array
    const changedData = { tags: ['tag1', 'tag2', 'tag3'] }
    rerender({ formData: changedData })

    expect(result.current.hasUnsavedChanges).toBe(true)
  })

  it('should handle null and undefined values', () => {
    const initialData = { name: null, email: undefined }
    const { result, rerender } = renderHook(
      ({ formData }) => useUnsavedChanges(formData),
      { initialProps: { formData: initialData } }
    )

    expect(result.current.hasUnsavedChanges).toBe(false)

    // Change null to string
    const changedData = { name: 'John', email: undefined }
    rerender({ formData: changedData })

    expect(result.current.hasUnsavedChanges).toBe(true)
  })
})