import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/lib/auth/auth-context'
import { createClient } from '@/utils/supabase/client'

// Mock Supabase client
jest.mock('@/utils/supabase/client')
const mockSupabase = createClient as jest.MockedFunction<typeof createClient>

// Test component that uses the auth context
function TestComponent() {
    const { user, profile, role, isVerified, loading } = useAuth()

    if (loading) return <div>Loading...</div>

    return (
        <div>
            <div data-testid="user">{user ? user.email : 'No user'}</div>
            <div data-testid="profile">{profile ? profile.full_name : 'No profile'}</div>
            <div data-testid="role">{role || 'No role'}</div>
            <div data-testid="verified">{isVerified ? 'Verified' : 'Not verified'}</div>
        </div>
    )
}

describe('AuthContext', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should provide initial loading state', () => {
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

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        )

        expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should handle authenticated user with profile and role', async () => {
        const mockUser = {
            id: '123',
            email: 'test@example.com',
            user_metadata: {},
        }

        const mockProfile = {
            id: '123',
            full_name: 'Test User',
            verified: true,
        }

        const mockUserRole = {
            roles: { name: 'mentor' }
        }

        const mockClient = {
            auth: {
                getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
                onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
            },
            from: jest.fn((table: string) => {
                if (table === 'profiles') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
                    }
                }
                if (table === 'user_roles') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: mockUserRole, error: null }),
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

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        )

        await waitFor(() => {
            expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
            expect(screen.getByTestId('profile')).toHaveTextContent('Test User')
            expect(screen.getByTestId('role')).toHaveTextContent('mentor')
            expect(screen.getByTestId('verified')).toHaveTextContent('Verified')
        })
    })

    it('should handle unauthenticated user', async () => {
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

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        )

        await waitFor(() => {
            expect(screen.getByTestId('user')).toHaveTextContent('No user')
            expect(screen.getByTestId('profile')).toHaveTextContent('No profile')
            expect(screen.getByTestId('role')).toHaveTextContent('No role')
            expect(screen.getByTestId('verified')).toHaveTextContent('Not verified')
        })
    })
})
