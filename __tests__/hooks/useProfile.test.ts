import { renderHook, act, waitFor } from '@testing-library/react'
import { useProfile } from '@/hooks/useProfile'

// Mock Supabase
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  })),
}

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}))

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}))

describe('useProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useProfile())

    expect(result.current.profile).toBeNull()
    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBeNull()
    expect(result.current.isUpdating).toBe(false)
  })

  it('should fetch profile successfully', async () => {
    const mockProfile = {
      id: '123',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
    }

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
    })

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: mockProfile,
      error: null,
    })

    const { result } = renderHook(() => useProfile())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.profile).toEqual(mockProfile)
    expect(result.current.error).toBeNull()
  })

  it('should handle fetch error', async () => {
    const mockError = { message: 'Profile not found' }

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
    })

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: null,
      error: mockError,
    })

    const { result } = renderHook(() => useProfile())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.profile).toBeNull()
    expect(result.current.error).toBe('Profile not found')
  })

  it('should update profile successfully', async () => {
    const mockProfile = {
      id: '123',
      first_name: 'John',
      last_name: 'Doe',
    }

    const updatedProfile = {
      ...mockProfile,
      first_name: 'Jane',
    }

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
    })

    // Mock initial fetch
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: mockProfile,
      error: null,
    })

    // Mock update
    mockSupabase.from().update().eq().select().single.mockResolvedValue({
      data: updatedProfile,
      error: null,
    })

    const { result } = renderHook(() => useProfile())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      const success = await result.current.updateProfile({ first_name: 'Jane' })
      expect(success).toBe(true)
    })

    expect(result.current.profile?.first_name).toBe('Jane')
    expect(result.current.isUpdating).toBe(false)
  })

  it('should handle update error', async () => {
    const mockProfile = {
      id: '123',
      first_name: 'John',
      last_name: 'Doe',
    }

    const mockError = { message: 'Update failed' }

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
    })

    // Mock initial fetch
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: mockProfile,
      error: null,
    })

    // Mock update error
    mockSupabase.from().update().eq().select().single.mockResolvedValue({
      data: null,
      error: mockError,
    })

    const { result } = renderHook(() => useProfile())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      const success = await result.current.updateProfile({ first_name: 'Jane' })
      expect(success).toBe(false)
    })

    expect(result.current.error).toBe('Update failed')
    expect(result.current.isUpdating).toBe(false)
  })

  it('should handle validation errors', async () => {
    const { result } = renderHook(() => useProfile())

    await act(async () => {
      const success = await result.current.updateProfile({
        first_name: '', // Invalid empty name
      })
      expect(success).toBe(false)
    })

    expect(result.current.error).toContain('Nome é obrigatório')
  })

  it('should implement optimistic updates', async () => {
    const mockProfile = {
      id: '123',
      first_name: 'John',
      last_name: 'Doe',
    }

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
    })

    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: mockProfile,
      error: null,
    })

    const { result } = renderHook(() => useProfile())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Start update - should immediately show optimistic update
    act(() => {
      result.current.updateProfile({ first_name: 'Jane' })
    })

    // Should show optimistic update immediately
    expect(result.current.profile?.first_name).toBe('Jane')
    expect(result.current.isUpdating).toBe(true)
  })
})