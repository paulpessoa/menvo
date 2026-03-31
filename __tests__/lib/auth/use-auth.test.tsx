import { renderHook, act } from '@testing-library/react'
import { useAuth } from '@/lib/auth/auth-context'
import { AuthProvider } from '@/lib/auth/auth-context'
import { createClient } from '@/utils/supabase/client'

// Mock Supabase client
jest.mock('@/utils/supabase/client')
const mockSupabase = createClient as jest.MockedFunction<typeof createClient>

// Wrapper component for testing hooks
function AuthWrapper({ children }: { children: React.ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>
}

describe('useAuth hook', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should return initial state', () => {
        const mockClient = {
            auth: {
                getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
                onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
            },
            from: jest.fn(() => ({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: null }),
            })),
        }

        mockSupabase.mockReturnValue(mockClient as any)

        const { result } = renderHook(() => useAuth(), {
            wrapper: AuthWrapper,
        })

        expect(result.current.user).toBeNull()
        expect(result.current.profile).toBeNull()
        expect(result.current.role).toBeNull()
        expect(result.current.isVerified).toBe(false)
        expect(result.current.loading).toBe(true)
        expect(typeof result.current.signIn).toBe('function')
        expect(typeof result.current.signUp).toBe('function')
        expect(typeof result.current.signInWithProvider).toBe('function')
        expect(typeof result.current.signOut).toBe('function')
        expect(typeof result.current.selectRole).toBe('function')
        expect(typeof result.current.refreshProfile).toBe('function')
    })

    it('should handle sign in', async () => {
        const mockSignIn = jest.fn().mockResolvedValue({ data: { user: null }, error: null })

        const mockClient = {
            auth: {
                getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
                onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
                signInWithPassword: mockSignIn,
            },
            from: jest.fn(() => ({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: null }),
            })),
        }

        mockSupabase.mockReturnValue(mockClient as any)

        const { result } = renderHook(() => useAuth(), {
            wrapper: AuthWrapper,
        })

        await act(async () => {
            await result.current.signIn('test@example.com', 'password123')
        })

        expect(mockSignIn).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123',
        })
    })

    it('should handle sign up', async () => {
        const mockSignUp = jest.fn().mockResolvedValue({ data: { user: null }, error: null })

        const mockClient = {
            auth: {
                getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
                onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
                signUp: mockSignUp,
            },
            from: jest.fn(() => ({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: null }),
            })),
        }

        mockSupabase.mockReturnValue(mockClient as any)

        const { result } = renderHook(() => useAuth(), {
            wrapper: AuthWrapper,
        })

        await act(async () => {
            await result.current.signUp('test@example.com', 'password123')
        })

        expect(mockSignUp).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123',
        })
    })

    it('should handle sign in with provider', async () => {
        const mockSignInWithOAuth = jest.fn().mockResolvedValue({ data: { user: null }, error: null })

        const mockClient = {
            auth: {
                getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
                onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
                signInWithOAuth: mockSignInWithOAuth,
            },
            from: jest.fn(() => ({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: null }),
            })),
        }

        mockSupabase.mockReturnValue(mockClient as any)

        const { result } = renderHook(() => useAuth(), {
            wrapper: AuthWrapper,
        })

        await act(async () => {
            await result.current.signInWithProvider('google')
        })

        expect(mockSignInWithOAuth).toHaveBeenCalledWith({
            provider: 'google',
            options: {
                redirectTo: expect.stringContaining('/auth/callback'),
            },
        })
    })

    it('should handle sign out', async () => {
        const mockSignOut = jest.fn().mockResolvedValue({ error: null })

        const mockClient = {
            auth: {
                getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
                onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
                signOut: mockSignOut,
            },
            from: jest.fn(() => ({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: null }),
            })),
        }

        mockSupabase.mockReturnValue(mockClient as any)

        const { result } = renderHook(() => useAuth(), {
            wrapper: AuthWrapper,
        })

        await act(async () => {
            await result.current.signOut()
        })

        expect(mockSignOut).toHaveBeenCalled()
    })

    it('should handle role selection', async () => {
        const mockInsert = jest.fn().mockResolvedValue({ data: null, error: null })
        const mockUpdate = jest.fn().mockResolvedValue({ data: null, error: null })

        const mockClient = {
            auth: {
                getUser: jest.fn().mockResolvedValue({
                    data: { user: { id: '123', email: 'test@example.com' } },
                    error: null
                }),
                onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
            },
            from: jest.fn((table: string) => {
                if (table === 'user_roles') {
                    return {
                        insert: mockInsert,
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: null, error: null }),
                    }
                }
                if (table === 'profiles') {
                    return {
                        update: mockUpdate,
                        eq: jest.fn().mockReturnThis(),
                        select: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: null, error: null }),
                    }
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: null, error: null }),
                }
            }),
        }

        mockSupabase.mockReturnValue(mockClient as any)

        const { result } = renderHook(() => useAuth(), {
            wrapper: AuthWrapper,
        })

        await act(async () => {
            await result.current.selectRole('mentor')
        })

        expect(mockInsert).toHaveBeenCalled()
    })

    it('should handle errors gracefully', async () => {
        const mockClient = {
            auth: {
                getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: { message: 'Auth error' } }),
                onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
                signInWithPassword: jest.fn().mockResolvedValue({
                    data: { user: null },
                    error: { message: 'Invalid credentials' }
                }),
            },
            from: jest.fn(() => ({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: null }),
            })),
        }

        mockSupabase.mockReturnValue(mockClient as any)

        const { result } = renderHook(() => useAuth(), {
            wrapper: AuthWrapper,
        })

        await act(async () => {
            try {
                await result.current.signIn('test@example.com', 'wrongpassword')
            } catch (error) {
                expect(error).toBeDefined()
            }
        })
    })
})
