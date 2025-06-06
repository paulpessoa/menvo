import { renderHook, act } from '@testing-library/react'
import { useUser } from '../useUser'
import { UserService } from '@/services/auth/userService'
import { supabase } from '@/services/auth/supabase'

// Mock do supabase
jest.mock('@/services/auth/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn()
    }
  }
}))

// Mock do UserService
jest.mock('@/services/auth/userService')

describe('useUser', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    avatar_url: 'https://example.com/avatar.jpg',
    role_type: 'mentor',
    email_verified: true
  }

  const mockProfile = {
    user_id: '123',
    first_name: 'John',
    last_name: 'Doe',
    avatar_url: 'https://example.com/avatar.jpg',
    bio: 'Test bio',
    location: 'Test location'
  }

  const mockRole = {
    user_id: '123',
    role_type: 'mentor',
    is_primary: true,
    status: 'active'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock das chamadas do supabase
    ;(supabase.from as jest.Mock).mockImplementation((table) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
    }))

    // Mock do UserService
    ;(UserService as jest.Mock).mockImplementation(() => ({
      updateUserRole: jest.fn().mockResolvedValue({ success: true }),
      confirmEmail: jest.fn().mockResolvedValue({ success: true })
    }))
  })

  it('should load user data successfully', async () => {
    const { result } = renderHook(() => useUser())

    // Aguarda o carregamento inicial
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.user).toEqual({
      id: mockUser.id,
      email: mockUser.email,
      firstName: mockUser.first_name,
      lastName: mockUser.last_name,
      avatarUrl: mockUser.avatar_url,
      role: mockRole.role_type,
      emailConfirmed: mockUser.email_verified,
      loading: false,
      error: null
    })
  })

  it('should handle updateRole successfully', async () => {
    const { result } = renderHook(() => useUser())

    await act(async () => {
      await result.current.updateRole('mentee')
    })

    expect(result.current.user?.role).toBe('mentee')
  })

  it('should handle confirmEmail successfully', async () => {
    const { result } = renderHook(() => useUser())

    await act(async () => {
      await result.current.confirmEmail()
    })

    expect(result.current.user?.emailConfirmed).toBe(true)
  })

  it('should handle errors when loading user data', async () => {
    // Mock de erro
    ;(supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: new Error('Test error') })
    }))

    const { result } = renderHook(() => useUser())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.user?.error).toBeTruthy()
  })
}) 