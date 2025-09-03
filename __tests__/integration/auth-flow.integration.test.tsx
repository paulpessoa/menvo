/**
 * Integration Tests for Auth Flow
 * Tests the complete authentication flow from signup to dashboard access
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '@/lib/auth/auth-context'
import { LoginForm } from '@/components/auth/login-form'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

// Mock Next.js router
const mockPush = jest.fn()
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: mockReplace,
        refresh: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        prefetch: jest.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/auth/login',
}))

// Mock Supabase client
jest.mock('@/utils/supabase/client')
const mockSupabase = createClient as jest.MockedFunction<typeof createClient>

// Mock fetch for API calls
global.fetch = jest.fn()

describe('Auth Flow Integration Tests', () => {
    let mockClient: any

    beforeEach(() => {
        jest.clearAllMocks()
        mockPush.mockClear()
        mockReplace.mockClear()

        mockClient = {
            auth: {
                getSession: jest.fn(),
                getUser: jest.fn(),
                onAuthStateChange: jest.fn(),
                signInWithPassword: jest.fn(),
                signUp: jest.fn(),
                signInWithOAuth: jest.fn(),
                signOut: jest.fn(),
                verifyOtp: jest.fn(),
            },
            from: jest.fn(() => ({
                select: jest.fn().mockReturnThis(),
                insert: jest.fn().mockReturnThis(),
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn(),
            })),
        }

        mockSupabase.mockReturnValue(mockClient)
            ; (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            })
    })

    describe('Complete Signup → Confirmation → Role Selection → Dashboard Flow', () => {
        it('should handle complete signup flow for new user', async () => {
            const user = userEvent.setup()

            // Mock successful signup
            mockClient.auth.signUp.mockResolvedValue({
                data: { user: null }, // User is null until email is confirmed
                error: null,
            })

            // Mock auth state changes
            const mockUnsubscribe = jest.fn()
            mockClient.auth.onAuthStateChange.mockReturnValue({
                data: { subscription: { unsubscribe: mockUnsubscribe } },
            })

            // Mock initial session (no user)
            mockClient.auth.getSession.mockResolvedValue({
                data: { session: null },
                error: null,
            })

            const TestSignupComponent = () => {
                const [email, setEmail] = React.useState('')
                const [password, setPassword] = React.useState('')
                const [firstName, setFirstName] = React.useState('')
                const [lastName, setLastName] = React.useState('')
                const { signUp } = useAuth()

                const handleSubmit = async (e: React.FormEvent) => {
                    e.preventDefault()
                    await signUp(email, password, firstName, lastName)
                }

                return (
                    <form onSubmit={handleSubmit}>
                        <input
                            data-testid="first-name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="First Name"
                        />
                        <input
                            data-testid="last-name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Last Name"
                        />
                        <input
                            data-testid="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                        />
                        <input
                            data-testid="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                        />
                        <button type="submit">Sign Up</button>
                    </form>
                )
            }

            render(
                <AuthProvider>
                    <TestSignupComponent />
                </AuthProvider>
            )

            // Fill signup form
            await user.type(screen.getByTestId('first-name'), 'João')
            await user.type(screen.getByTestId('last-name'), 'Silva')
            await user.type(screen.getByTestId('email'), 'joao@example.com')
            await user.type(screen.getByTestId('password'), 'password123')

            // Submit form
            await user.click(screen.getByText('Sign Up'))

            await waitFor(() => {
                expect(mockClient.auth.signUp).toHaveBeenCalledWith({
                    email: 'joao@example.com',
                    password: 'password123',
                    options: {
                        data: {
                            first_name: 'João',
                            last_name: 'Silva',
                            full_name: 'João Silva',
                        },
                    },
                })
            })
        })

        it('should handle email confirmation callback', async () => {
            // Mock successful OTP verification
            mockClient.auth.verifyOtp.mockResolvedValue({
                data: {
                    user: {
                        id: '123',
                        email: 'joao@example.com',
                        email_confirmed_at: new Date().toISOString(),
                    }
                },
                error: null,
            })

            // Mock profile creation (should happen via trigger)
            mockClient.from.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: {
                                id: '123',
                                email: 'joao@example.com',
                                first_name: 'João',
                                last_name: 'Silva',
                                full_name: 'João Silva',
                                verified: false,
                            },
                            error: null,
                        }),
                    }
                }
                if (table === 'user_roles') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: null, // No role yet
                            error: { code: 'PGRST116' }, // Not found
                        }),
                    }
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: null, error: null }),
                }
            })

            const TestCallbackComponent = () => {
                const { user, role, loading } = useAuth()

                React.useEffect(() => {
                    // Simulate callback processing
                    if (!loading && user && !role) {
                        // Should redirect to role selection
                        mockPush('/auth/select-role')
                    }
                }, [user, role, loading])

                if (loading) return <div>Loading...</div>

                return (
                    <div>
                        <div data-testid="user-email">{user?.email || 'No user'}</div>
                        <div data-testid="user-role">{role || 'No role'}</div>
                    </div>
                )
            }

            render(
                <AuthProvider>
                    <TestCallbackComponent />
                </AuthProvider>
            )

            // Simulate confirmed user state
            await waitFor(() => {
                mockClient.auth.onAuthStateChange.mock.calls[0][1]('SIGNED_IN', {
                    user: {
                        id: '123',
                        email: 'joao@example.com',
                        email_confirmed_at: new Date().toISOString(),
                    },
                })
            })

            await waitFor(() => {
                expect(screen.getByTestId('user-email')).toHaveTextContent('joao@example.com')
                expect(screen.getByTestId('user-role')).toHaveTextContent('No role')
                expect(mockPush).toHaveBeenCalledWith('/auth/select-role')
            })
        })

        it('should handle role selection flow', async () => {
            const user = userEvent.setup()

            // Mock authenticated user without role
            const mockUser = {
                id: '123',
                email: 'joao@example.com',
            }

            mockClient.auth.getSession.mockResolvedValue({
                data: { session: { user: mockUser } },
                error: null,
            })

            mockClient.from.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: {
                                id: '123',
                                email: 'joao@example.com',
                                first_name: 'João',
                                last_name: 'Silva',
                                verified: false,
                            },
                            error: null,
                        }),
                    }
                }
                if (table === 'user_roles') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: null,
                            error: { code: 'PGRST116' },
                        }),
                    }
                }
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: null, error: null }),
                }
            })

            const TestRoleSelectionComponent = () => {
                const { user, selectRole, role } = useAuth()
                const [selectedRole, setSelectedRole] = React.useState<'mentor' | 'mentee' | ''>('')

                const handleRoleSelection = async () => {
                    if (selectedRole) {
                        await selectRole(selectedRole)
                    }
                }

                return (
                    <div>
                        <div data-testid="user-id">{user?.id || 'No user'}</div>
                        <div data-testid="current-role">{role || 'No role'}</div>
                        <button
                            data-testid="mentor-button"
                            onClick={() => setSelectedRole('mentor')}
                        >
                            Select Mentor
                        </button>
                        <button
                            data-testid="mentee-button"
                            onClick={() => setSelectedRole('mentee')}
                        >
                            Select Mentee
                        </button>
                        <button
                            data-testid="confirm-button"
                            onClick={handleRoleSelection}
                            disabled={!selectedRole}
                        >
                            Confirm Role
                        </button>
                        <div data-testid="selected-role">{selectedRole}</div>
                    </div>
                )
            }

            render(
                <AuthProvider>
                    <TestRoleSelectionComponent />
                </AuthProvider>
            )

            await waitFor(() => {
                expect(screen.getByTestId('user-id')).toHaveTextContent('123')
                expect(screen.getByTestId('current-role')).toHaveTextContent('No role')
            })

            // Select mentor role
            await user.click(screen.getByTestId('mentor-button'))
            expect(screen.getByTestId('selected-role')).toHaveTextContent('mentor')

            // Confirm role selection
            await user.click(screen.getByTestId('confirm-button'))

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith('/api/auth/select-role', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: '123',
                        role: 'mentor',
                    }),
                })
            })
        })
    })

    describe('Login with Different Providers', () => {
        it('should handle email/password login', async () => {
            const user = userEvent.setup()

            mockClient.auth.signInWithPassword.mockResolvedValue({
                data: {
                    user: {
                        id: '123',
                        email: 'joao@example.com'
                    }
                },
                error: null,
            })

            render(
                <AuthProvider>
                    <LoginForm />
                </AuthProvider>
            )

            await user.type(screen.getByLabelText(/email/i), 'joao@example.com')
            await user.type(screen.getByLabelText(/senha/i), 'password123')
            await user.click(screen.getByRole('button', { name: /entrar/i }))

            await waitFor(() => {
                expect(mockClient.auth.signInWithPassword).toHaveBeenCalledWith({
                    email: 'joao@example.com',
                    password: 'password123',
                })
            })
        })

        it('should handle Google OAuth login', async () => {
            const user = userEvent.setup()

            mockClient.auth.signInWithOAuth.mockResolvedValue({
                data: { url: 'https://google.com/oauth' },
                error: null,
            })

            render(
                <AuthProvider>
                    <LoginForm />
                </AuthProvider>
            )

            await user.click(screen.getByRole('button', { name: /continuar com google/i }))

            await waitFor(() => {
                expect(mockClient.auth.signInWithOAuth).toHaveBeenCalledWith({
                    provider: 'google',
                    options: {
                        redirectTo: expect.stringContaining('/auth/callback'),
                    },
                })
            })
        })

        it('should handle LinkedIn OAuth login', async () => {
            const user = userEvent.setup()

            mockClient.auth.signInWithOAuth.mockResolvedValue({
                data: { url: 'https://linkedin.com/oauth' },
                error: null,
            })

            render(
                <AuthProvider>
                    <LoginForm />
                </AuthProvider>
            )

            await user.click(screen.getByRole('button', { name: /continuar com linkedin/i }))

            await waitFor(() => {
                expect(mockClient.auth.signInWithOAuth).toHaveBeenCalledWith({
                    provider: 'linkedin_oidc',
                    options: {
                        redirectTo: expect.stringContaining('/auth/callback'),
                    },
                })
            })
        })

        it('should handle email not confirmed error', async () => {
            const user = userEvent.setup()

            mockClient.auth.signInWithPassword.mockResolvedValue({
                data: { user: null },
                error: { message: 'Email not confirmed' },
            })

            render(
                <AuthProvider>
                    <LoginForm />
                </AuthProvider>
            )

            await user.type(screen.getByLabelText(/email/i), 'joao@example.com')
            await user.type(screen.getByLabelText(/senha/i), 'password123')
            await user.click(screen.getByRole('button', { name: /entrar/i }))

            await waitFor(() => {
                expect(screen.getByText(/confirme seu email/i)).toBeInTheDocument()
            })
        })
    })
})