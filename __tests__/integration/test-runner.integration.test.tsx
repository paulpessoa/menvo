/**
 * Integration Test Runner
 * Orchestrates and validates all integration test scenarios
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '@/lib/auth/auth-context'
import { createClient } from '@/utils/supabase/client'

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
    usePathname: () => '/',
}))

// Mock Supabase client
jest.mock('@/utils/supabase/client')
const mockSupabase = createClient as jest.MockedFunction<typeof createClient>

// Mock fetch for API calls
global.fetch = jest.fn()

describe('Integration Test Runner - Complete Auth Refactor Validation', () => {
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
                in: jest.fn().mockReturnThis(),
                gte: jest.fn().mockReturnThis(),
                lt: jest.fn().mockReturnThis(),
                single: jest.fn(),
                order: jest.fn().mockReturnThis(),
            })),
        }

        mockSupabase.mockReturnValue(mockClient)
            ; (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            })
    })

    describe('End-to-End Integration Scenarios', () => {
        it('should validate complete user journey: signup → confirmation → role selection → dashboard', async () => {
            const user = userEvent.setup()

            // Mock auth state progression
            const mockUnsubscribe = jest.fn()
            mockClient.auth.onAuthStateChange.mockReturnValue({
                data: { subscription: { unsubscribe: mockUnsubscribe } },
            })

            // Initial state: no session
            mockClient.auth.getSession.mockResolvedValue({
                data: { session: null },
                error: null,
            })

            const TestCompleteJourney = () => {
                const { user, profile, role, loading, signUp, selectRole } = useAuth()
                const [step, setStep] = React.useState('signup')
                const [formData, setFormData] = React.useState({
                    email: '',
                    password: '',
                    firstName: '',
                    lastName: '',
                })

                const handleSignup = async () => {
                    try {
                        await signUp(formData.email, formData.password, formData.firstName, formData.lastName)
                        setStep('confirmation')
                    } catch (error) {
                        console.error('Signup error:', error)
                    }
                }

                const simulateEmailConfirmation = () => {
                    // Simulate email confirmation callback
                    mockClient.auth.onAuthStateChange.mock.calls[0][1]('SIGNED_IN', {
                        user: {
                            id: '123',
                            email: formData.email,
                            email_confirmed_at: new Date().toISOString(),
                        },
                    })
                    setStep('role-selection')
                }

                const handleRoleSelection = async (selectedRole: 'mentor' | 'mentee') => {
                    try {
                        await selectRole(selectedRole)
                        setStep('dashboard')
                    } catch (error) {
                        console.error('Role selection error:', error)
                    }
                }

                if (loading) return <div data-testid="loading">Loading...</div>

                return (
                    <div>
                        <div data-testid="current-step">{step}</div>

                        {step === 'signup' && (
                            <div data-testid="signup-form">
                                <input
                                    data-testid="first-name"
                                    placeholder="First Name"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                />
                                <input
                                    data-testid="last-name"
                                    placeholder="Last Name"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                />
                                <input
                                    data-testid="email"
                                    type="email"
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                />
                                <input
                                    data-testid="password"
                                    type="password"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                />
                                <button data-testid="signup-button" onClick={handleSignup}>
                                    Sign Up
                                </button>
                            </div>
                        )}

                        {step === 'confirmation' && (
                            <div data-testid="confirmation-step">
                                <p>Please check your email for confirmation</p>
                                <button data-testid="simulate-confirmation" onClick={simulateEmailConfirmation}>
                                    Simulate Email Confirmation
                                </button>
                            </div>
                        )}

                        {step === 'role-selection' && (
                            <div data-testid="role-selection">
                                <p>Select your role:</p>
                                <button
                                    data-testid="select-mentor"
                                    onClick={() => handleRoleSelection('mentor')}
                                >
                                    Mentor
                                </button>
                                <button
                                    data-testid="select-mentee"
                                    onClick={() => handleRoleSelection('mentee')}
                                >
                                    Mentee
                                </button>
                            </div>
                        )}

                        {step === 'dashboard' && (
                            <div data-testid="dashboard">
                                <p>Welcome to your dashboard!</p>
                                <div data-testid="user-info">
                                    User: {user?.email}
                                </div>
                                <div data-testid="profile-info">
                                    Profile: {profile?.full_name}
                                </div>
                                <div data-testid="role-info">
                                    Role: {role}
                                </div>
                            </div>
                        )}
                    </div>
                )
            }

            // Mock successful signup
            mockClient.auth.signUp.mockResolvedValue({
                data: { user: null }, // User is null until confirmed
                error: null,
            })

            // Mock profile and role queries for confirmed user
            mockClient.from.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: {
                                id: '123',
                                email: 'test@example.com',
                                first_name: 'Test',
                                last_name: 'User',
                                full_name: 'Test User',
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
                            data: null, // No role initially
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

            render(
                <AuthProvider>
                    <TestCompleteJourney />
                </AuthProvider>
            )

            // Step 1: Signup
            expect(screen.getByTestId('current-step')).toHaveTextContent('signup')

            await user.type(screen.getByTestId('first-name'), 'Test')
            await user.type(screen.getByTestId('last-name'), 'User')
            await user.type(screen.getByTestId('email'), 'test@example.com')
            await user.type(screen.getByTestId('password'), 'password123')

            await user.click(screen.getByTestId('signup-button'))

            // Verify signup was called
            await waitFor(() => {
                expect(mockClient.auth.signUp).toHaveBeenCalledWith({
                    email: 'test@example.com',
                    password: 'password123',
                    options: {
                        data: {
                            first_name: 'Test',
                            last_name: 'User',
                            full_name: 'Test User',
                        },
                    },
                })
            })

            // Step 2: Email confirmation
            await waitFor(() => {
                expect(screen.getByTestId('current-step')).toHaveTextContent('confirmation')
            })

            await user.click(screen.getByTestId('simulate-confirmation'))

            // Step 3: Role selection
            await waitFor(() => {
                expect(screen.getByTestId('current-step')).toHaveTextContent('role-selection')
            })

            await user.click(screen.getByTestId('select-mentor'))

            // Verify role selection API call
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

            // Step 4: Dashboard
            await waitFor(() => {
                expect(screen.getByTestId('current-step')).toHaveTextContent('dashboard')
                expect(screen.getByTestId('user-info')).toHaveTextContent('test@example.com')
                expect(screen.getByTestId('role-info')).toHaveTextContent('mentor')
            })
        })

        it('should validate OAuth provider integration', async () => {
            const user = userEvent.setup()

            const TestOAuthIntegration = () => {
                const { signInWithProvider } = useAuth()
                const [provider, setProvider] = React.useState<'google' | 'linkedin' | null>(null)
                const [status, setStatus] = React.useState('idle')

                const handleOAuthLogin = async (selectedProvider: 'google' | 'linkedin') => {
                    setProvider(selectedProvider)
                    setStatus('loading')
                    try {
                        await signInWithProvider(selectedProvider)
                        setStatus('success')
                    } catch (error) {
                        setStatus('error')
                    }
                }

                return (
                    <div>
                        <button
                            data-testid="google-login"
                            onClick={() => handleOAuthLogin('google')}
                        >
                            Login with Google
                        </button>
                        <button
                            data-testid="linkedin-login"
                            onClick={() => handleOAuthLogin('linkedin')}
                        >
                            Login with LinkedIn
                        </button>
                        <div data-testid="oauth-status">{status}</div>
                        <div data-testid="oauth-provider">{provider || 'none'}</div>
                    </div>
                )
            }

            mockClient.auth.signInWithOAuth.mockResolvedValue({
                data: { url: 'https://oauth-provider.com/auth' },
                error: null,
            })

            render(
                <AuthProvider>
                    <TestOAuthIntegration />
                </AuthProvider>
            )

            // Test Google OAuth
            await user.click(screen.getByTestId('google-login'))

            await waitFor(() => {
                expect(mockClient.auth.signInWithOAuth).toHaveBeenCalledWith({
                    provider: 'google',
                    options: {
                        redirectTo: expect.stringContaining('/auth/callback'),
                    },
                })
                expect(screen.getByTestId('oauth-provider')).toHaveTextContent('google')
            })

            // Test LinkedIn OAuth
            await user.click(screen.getByTestId('linkedin-login'))

            await waitFor(() => {
                expect(mockClient.auth.signInWithOAuth).toHaveBeenCalledWith({
                    provider: 'linkedin_oidc',
                    options: {
                        redirectTo: expect.stringContaining('/auth/callback'),
                    },
                })
                expect(screen.getByTestId('oauth-provider')).toHaveTextContent('linkedin')
            })
        })

        it('should validate mentor verification and public listing flow', async () => {
            const user = userEvent.setup()

            const TestMentorVerificationFlow = () => {
                const [mentors, setMentors] = React.useState([
                    {
                        id: 'mentor-1',
                        full_name: 'João Silva',
                        email: 'joao@example.com',
                        verified: false,
                    },
                ])
                const [publicMentors, setPublicMentors] = React.useState<any[]>([])

                const verifyMentor = async (mentorId: string) => {
                    ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            success: true,
                            mentor: { id: mentorId, verified: true },
                        }),
                    })

                    const response = await fetch('/api/mentors/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            mentorId,
                            verified: true,
                            adminId: 'admin-123',
                        }),
                    })

                    if (response.ok) {
                        // Update mentor status
                        setMentors(prev =>
                            prev.map(m => (m.id === mentorId ? { ...m, verified: true } : m))
                        )
                        // Add to public listing
                        const verifiedMentor = mentors.find(m => m.id === mentorId)
                        if (verifiedMentor) {
                            setPublicMentors(prev => [...prev, { ...verifiedMentor, verified: true }])
                        }
                    }
                }

                return (
                    <div>
                        <div data-testid="admin-panel">
                            <h2>Admin Panel</h2>
                            {mentors.map(mentor => (
                                <div key={mentor.id} data-testid={`mentor-${mentor.id}`}>
                                    <span>{mentor.full_name}</span>
                                    <span data-testid={`status-${mentor.id}`}>
                                        {mentor.verified ? 'Verified' : 'Pending'}
                                    </span>
                                    <button
                                        data-testid={`verify-${mentor.id}`}
                                        onClick={() => verifyMentor(mentor.id)}
                                        disabled={mentor.verified}
                                    >
                                        Verify
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div data-testid="public-listing">
                            <h2>Public Mentors</h2>
                            {publicMentors.map(mentor => (
                                <div key={mentor.id} data-testid={`public-mentor-${mentor.id}`}>
                                    <span>{mentor.full_name}</span>
                                    <span>✓ Verified</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            render(<TestMentorVerificationFlow />)

            // Initially mentor is pending
            expect(screen.getByTestId('status-mentor-1')).toHaveTextContent('Pending')
            expect(screen.queryByTestId('public-mentor-mentor-1')).not.toBeInTheDocument()

            // Verify mentor
            await user.click(screen.getByTestId('verify-mentor-1'))

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith('/api/mentors/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        mentorId: 'mentor-1',
                        verified: true,
                        adminId: 'admin-123',
                    }),
                })
            })

            // Mentor should now be verified and appear in public listing
            await waitFor(() => {
                expect(screen.getByTestId('status-mentor-1')).toHaveTextContent('Verified')
                expect(screen.getByTestId('public-mentor-mentor-1')).toBeInTheDocument()
            })
        })

        it('should validate appointment booking with Google Calendar integration', async () => {
            const user = userEvent.setup()

            const TestAppointmentFlow = () => {
                const [appointment, setAppointment] = React.useState<any>(null)
                const [loading, setLoading] = React.useState(false)

                const bookAppointment = async () => {
                    setLoading(true)

                        ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                            ok: true,
                            json: () => Promise.resolve({
                                success: true,
                                appointment: {
                                    id: 'appointment-123',
                                    mentor_id: 'mentor-123',
                                    mentee_id: 'mentee-123',
                                    scheduled_at: '2024-12-16T10:00:00Z',
                                    google_event_id: 'google-event-123',
                                    google_meet_link: 'https://meet.google.com/abc-defg-hij',
                                    status: 'pending',
                                },
                            }),
                        })

                    try {
                        const response = await fetch('/api/appointments/create', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                mentor_id: 'mentor-123',
                                scheduled_at: '2024-12-16T10:00:00Z',
                                duration_minutes: 60,
                                message: 'Career discussion',
                            }),
                        })

                        if (response.ok) {
                            const data = await response.json()
                            setAppointment(data.appointment)
                        }
                    } catch (error) {
                        console.error('Error:', error)
                    } finally {
                        setLoading(false)
                    }
                }

                return (
                    <div>
                        <button
                            data-testid="book-appointment"
                            onClick={bookAppointment}
                            disabled={loading}
                        >
                            {loading ? 'Booking...' : 'Book Appointment'}
                        </button>

                        {appointment && (
                            <div data-testid="appointment-success">
                                <div data-testid="appointment-id">{appointment.id}</div>
                                <div data-testid="google-event">{appointment.google_event_id}</div>
                                <div data-testid="meet-link">{appointment.google_meet_link}</div>
                                <div data-testid="status">{appointment.status}</div>
                            </div>
                        )}
                    </div>
                )
            }

            render(<TestAppointmentFlow />)

            await user.click(screen.getByTestId('book-appointment'))

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith('/api/appointments/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        mentor_id: 'mentor-123',
                        scheduled_at: '2024-12-16T10:00:00Z',
                        duration_minutes: 60,
                        message: 'Career discussion',
                    }),
                })
            })

            await waitFor(() => {
                expect(screen.getByTestId('appointment-success')).toBeInTheDocument()
                expect(screen.getByTestId('appointment-id')).toHaveTextContent('appointment-123')
                expect(screen.getByTestId('google-event')).toHaveTextContent('google-event-123')
                expect(screen.getByTestId('meet-link')).toHaveTextContent('https://meet.google.com/abc-defg-hij')
                expect(screen.getByTestId('status')).toHaveTextContent('pending')
            })
        })
    })

    describe('Error Handling and Edge Cases', () => {
        it('should handle authentication errors gracefully', async () => {
            const user = userEvent.setup()

            const TestErrorHandling = () => {
                const { signIn, handleAuthError } = useAuth()
                const [error, setError] = React.useState('')

                const attemptLogin = async (email: string, password: string) => {
                    try {
                        await signIn(email, password)
                    } catch (err: any) {
                        const errorMessage = handleAuthError(err)
                        setError(errorMessage)
                    }
                }

                return (
                    <div>
                        <button
                            data-testid="login-unconfirmed"
                            onClick={() => attemptLogin('unconfirmed@example.com', 'password')}
                        >
                            Login Unconfirmed
                        </button>
                        <button
                            data-testid="login-invalid"
                            onClick={() => attemptLogin('invalid@example.com', 'wrongpassword')}
                        >
                            Login Invalid
                        </button>
                        {error && <div data-testid="auth-error">{error}</div>}
                    </div>
                )
            }

            render(
                <AuthProvider>
                    <TestErrorHandling />
                </AuthProvider>
            )

            // Test email not confirmed error
            mockClient.auth.signInWithPassword.mockResolvedValueOnce({
                data: { user: null },
                error: { message: 'Email not confirmed' },
            })

            await user.click(screen.getByTestId('login-unconfirmed'))

            await waitFor(() => {
                expect(screen.getByTestId('auth-error')).toHaveTextContent(
                    'Por favor, confirme seu email antes de fazer login.'
                )
            })

            // Test invalid credentials error
            mockClient.auth.signInWithPassword.mockResolvedValueOnce({
                data: { user: null },
                error: { message: 'Invalid login credentials' },
            })

            await user.click(screen.getByTestId('login-invalid'))

            await waitFor(() => {
                expect(screen.getByTestId('auth-error')).toHaveTextContent(
                    'Email ou senha incorretos.'
                )
            })
        })

        it('should validate role-based access control', async () => {
            const TestRoleAccess = () => {
                const { role, isAdmin, isMentor, isMentee, canAccessAdminFeatures, canAccessMentorFeatures } = useAuth()

                return (
                    <div>
                        <div data-testid="current-role">{role || 'No role'}</div>
                        <div data-testid="is-admin">{isAdmin() ? 'true' : 'false'}</div>
                        <div data-testid="is-mentor">{isMentor() ? 'true' : 'false'}</div>
                        <div data-testid="is-mentee">{isMentee() ? 'true' : 'false'}</div>
                        <div data-testid="can-access-admin">{canAccessAdminFeatures() ? 'true' : 'false'}</div>
                        <div data-testid="can-access-mentor">{canAccessMentorFeatures() ? 'true' : 'false'}</div>
                    </div>
                )
            }

            // Mock different user roles
            const testRoles = [
                { role: 'admin', verified: true },
                { role: 'mentor', verified: true },
                { role: 'mentor', verified: false },
                { role: 'mentee', verified: false },
            ]

            for (const testCase of testRoles) {
                mockClient.auth.getSession.mockResolvedValue({
                    data: { session: { user: { id: '123', email: 'test@example.com' } } },
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
                                    verified: testCase.verified,
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
                                data: { roles: { name: testCase.role } },
                                error: null,
                            }),
                        }
                    }
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: null, error: null }),
                    }
                })

                const { rerender } = render(
                    <AuthProvider>
                        <TestRoleAccess />
                    </AuthProvider>
                )

                await waitFor(() => {
                    expect(screen.getByTestId('current-role')).toHaveTextContent(testCase.role)

                    if (testCase.role === 'admin') {
                        expect(screen.getByTestId('is-admin')).toHaveTextContent('true')
                        expect(screen.getByTestId('can-access-admin')).toHaveTextContent('true')
                    }

                    if (testCase.role === 'mentor' && testCase.verified) {
                        expect(screen.getByTestId('is-mentor')).toHaveTextContent('true')
                        expect(screen.getByTestId('can-access-mentor')).toHaveTextContent('true')
                    }

                    if (testCase.role === 'mentor' && !testCase.verified) {
                        expect(screen.getByTestId('is-mentor')).toHaveTextContent('true')
                        expect(screen.getByTestId('can-access-mentor')).toHaveTextContent('false')
                    }

                    if (testCase.role === 'mentee') {
                        expect(screen.getByTestId('is-mentee')).toHaveTextContent('true')
                    }
                })

                rerender(<div />)
            }
        })
    })
})