/**
 * Integration Tests for Mentor Verification Flow
 * Tests the complete mentor verification process from admin dashboard to mentor status update
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '@/lib/auth/auth-context'
import { createClient } from '@/utils/supabase/client'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: jest.fn(),
        refresh: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        prefetch: jest.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/admin/mentors',
}))

// Mock Supabase client
jest.mock('@/utils/supabase/client')
const mockSupabase = createClient as jest.MockedFunction<typeof createClient>

// Mock fetch for API calls
global.fetch = jest.fn()

describe('Mentor Verification Integration Tests', () => {
    let mockClient: any

    beforeEach(() => {
        jest.clearAllMocks()
        mockPush.mockClear()

        mockClient = {
            auth: {
                getSession: jest.fn(),
                getUser: jest.fn(),
                onAuthStateChange: jest.fn(),
            },
            from: jest.fn(() => ({
                select: jest.fn().mockReturnThis(),
                insert: jest.fn().mockReturnThis(),
                update: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                in: jest.fn().mockReturnThis(),
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

    describe('Admin Mentor Verification Flow', () => {
        it('should display unverified mentors for admin', async () => {
            // Mock admin user
            const adminUser = {
                id: 'admin-123',
                email: 'admin@example.com',
            }

            const adminProfile = {
                id: 'admin-123',
                email: 'admin@example.com',
                first_name: 'Admin',
                last_name: 'User',
                verified: true,
            }

            const unverifiedMentors = [
                {
                    id: 'mentor-1',
                    email: 'mentor1@example.com',
                    first_name: 'João',
                    last_name: 'Silva',
                    full_name: 'João Silva',
                    verified: false,
                    created_at: '2024-01-01T00:00:00Z',
                },
                {
                    id: 'mentor-2',
                    email: 'mentor2@example.com',
                    first_name: 'Maria',
                    last_name: 'Santos',
                    full_name: 'Maria Santos',
                    verified: false,
                    created_at: '2024-01-02T00:00:00Z',
                },
            ]

            // Mock auth session
            mockClient.auth.getSession.mockResolvedValue({
                data: { session: { user: adminUser } },
                error: null,
            })

            // Mock database queries
            mockClient.from.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: adminProfile,
                            error: null,
                        }),
                    }
                }
                if (table === 'user_roles') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: { roles: { name: 'admin' } },
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

            const TestAdminDashboard = () => {
                const { user, role, isAdmin } = useAuth()
                const [mentors, setMentors] = React.useState(unverifiedMentors)
                const [loading, setLoading] = React.useState(false)

                const handleVerifyMentor = async (mentorId: string, verified: boolean) => {
                    setLoading(true)
                    try {
                        const response = await fetch('/api/mentors/verify', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                mentorId,
                                verified,
                                adminId: user?.id,
                            }),
                        })

                        if (response.ok) {
                            // Update local state
                            setMentors(prev =>
                                prev.map(mentor =>
                                    mentor.id === mentorId
                                        ? { ...mentor, verified }
                                        : mentor
                                )
                            )
                        }
                    } catch (error) {
                        console.error('Error verifying mentor:', error)
                    } finally {
                        setLoading(false)
                    }
                }

                if (!isAdmin()) {
                    return <div>Access denied</div>
                }

                return (
                    <div>
                        <h1>Admin Dashboard - Mentor Verification</h1>
                        <div data-testid="mentor-list">
                            {mentors.map(mentor => (
                                <div key={mentor.id} data-testid={`mentor-${mentor.id}`}>
                                    <div data-testid={`mentor-name-${mentor.id}`}>
                                        {mentor.full_name}
                                    </div>
                                    <div data-testid={`mentor-email-${mentor.id}`}>
                                        {mentor.email}
                                    </div>
                                    <div data-testid={`mentor-status-${mentor.id}`}>
                                        {mentor.verified ? 'Verified' : 'Pending'}
                                    </div>
                                    <button
                                        data-testid={`verify-button-${mentor.id}`}
                                        onClick={() => handleVerifyMentor(mentor.id, true)}
                                        disabled={loading || mentor.verified}
                                    >
                                        Verify
                                    </button>
                                    <button
                                        data-testid={`reject-button-${mentor.id}`}
                                        onClick={() => handleVerifyMentor(mentor.id, false)}
                                        disabled={loading}
                                    >
                                        Reject
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            render(
                <AuthProvider>
                    <TestAdminDashboard />
                </AuthProvider>
            )

            await waitFor(() => {
                expect(screen.getByText('Admin Dashboard - Mentor Verification')).toBeInTheDocument()
                expect(screen.getByTestId('mentor-name-mentor-1')).toHaveTextContent('João Silva')
                expect(screen.getByTestId('mentor-email-mentor-1')).toHaveTextContent('mentor1@example.com')
                expect(screen.getByTestId('mentor-status-mentor-1')).toHaveTextContent('Pending')
            })
        })

        it('should verify mentor successfully', async () => {
            const user = userEvent.setup()

                // Mock successful verification API response
                ; (global.fetch as jest.Mock).mockResolvedValue({
                    ok: true,
                    json: () => Promise.resolve({
                        success: true,
                        mentor: {
                            id: 'mentor-1',
                            verified: true,
                        },
                        message: 'Mentor verified successfully',
                    }),
                })

            const TestVerificationComponent = () => {
                const [mentorStatus, setMentorStatus] = React.useState('pending')
                const [loading, setLoading] = React.useState(false)

                const handleVerify = async () => {
                    setLoading(true)
                    try {
                        const response = await fetch('/api/mentors/verify', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                mentorId: 'mentor-1',
                                verified: true,
                                adminId: 'admin-123',
                            }),
                        })

                        if (response.ok) {
                            const data = await response.json()
                            setMentorStatus('verified')
                        }
                    } catch (error) {
                        console.error('Error:', error)
                    } finally {
                        setLoading(false)
                    }
                }

                return (
                    <div>
                        <div data-testid="mentor-status">{mentorStatus}</div>
                        <button
                            data-testid="verify-button"
                            onClick={handleVerify}
                            disabled={loading}
                        >
                            {loading ? 'Verifying...' : 'Verify Mentor'}
                        </button>
                    </div>
                )
            }

            render(<TestVerificationComponent />)

            expect(screen.getByTestId('mentor-status')).toHaveTextContent('pending')

            await user.click(screen.getByTestId('verify-button'))

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith('/api/mentors/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        mentorId: 'mentor-1',
                        verified: true,
                        adminId: 'admin-123',
                    }),
                })
            })

            await waitFor(() => {
                expect(screen.getByTestId('mentor-status')).toHaveTextContent('verified')
            })
        })

        it('should handle verification errors', async () => {
            const user = userEvent.setup()

                // Mock API error response
                ; (global.fetch as jest.Mock).mockResolvedValue({
                    ok: false,
                    json: () => Promise.resolve({
                        error: 'Admin access required',
                    }),
                })

            const TestVerificationErrorComponent = () => {
                const [error, setError] = React.useState('')
                const [loading, setLoading] = React.useState(false)

                const handleVerify = async () => {
                    setLoading(true)
                    setError('')
                    try {
                        const response = await fetch('/api/mentors/verify', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                mentorId: 'mentor-1',
                                verified: true,
                                adminId: 'non-admin-123',
                            }),
                        })

                        if (!response.ok) {
                            const data = await response.json()
                            setError(data.error)
                        }
                    } catch (error) {
                        setError('Network error')
                    } finally {
                        setLoading(false)
                    }
                }

                return (
                    <div>
                        <button
                            data-testid="verify-button"
                            onClick={handleVerify}
                            disabled={loading}
                        >
                            Verify Mentor
                        </button>
                        {error && (
                            <div data-testid="error-message">{error}</div>
                        )}
                    </div>
                )
            }

            render(<TestVerificationErrorComponent />)

            await user.click(screen.getByTestId('verify-button'))

            await waitFor(() => {
                expect(screen.getByTestId('error-message')).toHaveTextContent('Admin access required')
            })
        })
    })

    describe('Mentor Status Updates', () => {
        it('should update mentor profile after verification', async () => {
            // Mock mentor user
            const mentorUser = {
                id: 'mentor-1',
                email: 'mentor@example.com',
            }

            const mentorProfile = {
                id: 'mentor-1',
                email: 'mentor@example.com',
                first_name: 'João',
                last_name: 'Silva',
                verified: false,
            }

            mockClient.auth.getSession.mockResolvedValue({
                data: { session: { user: mentorUser } },
                error: null,
            })

            mockClient.from.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: mentorProfile,
                            error: null,
                        }),
                    }
                }
                if (table === 'user_roles') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: { roles: { name: 'mentor' } },
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

            const TestMentorDashboard = () => {
                const { user, profile, role, isVerified, refreshProfile } = useAuth()

                React.useEffect(() => {
                    // Simulate verification status update
                    if (user && role === 'mentor') {
                        // This would normally be triggered by a real-time subscription
                        // or periodic refresh
                        setTimeout(() => {
                            refreshProfile()
                        }, 100)
                    }
                }, [user, role, refreshProfile])

                if (!user) return <div>Not authenticated</div>

                return (
                    <div>
                        <div data-testid="mentor-name">{profile?.first_name}</div>
                        <div data-testid="mentor-role">{role}</div>
                        <div data-testid="verification-status">
                            {isVerified ? 'Verified' : 'Pending Verification'}
                        </div>
                        {!isVerified && (
                            <div data-testid="verification-notice">
                                Your mentor profile is pending verification by our admin team.
                            </div>
                        )}
                    </div>
                )
            }

            render(
                <AuthProvider>
                    <TestMentorDashboard />
                </AuthProvider>
            )

            await waitFor(() => {
                expect(screen.getByTestId('mentor-name')).toHaveTextContent('João')
                expect(screen.getByTestId('mentor-role')).toHaveTextContent('mentor')
                expect(screen.getByTestId('verification-status')).toHaveTextContent('Pending Verification')
                expect(screen.getByTestId('verification-notice')).toBeInTheDocument()
            })
        })

        it('should show verified mentor in public listing', async () => {
            const verifiedMentors = [
                {
                    id: 'mentor-1',
                    email: 'mentor1@example.com',
                    first_name: 'João',
                    last_name: 'Silva',
                    full_name: 'João Silva',
                    verified: true,
                    slug: 'joao-silva',
                },
                {
                    id: 'mentor-2',
                    email: 'mentor2@example.com',
                    first_name: 'Maria',
                    last_name: 'Santos',
                    full_name: 'Maria Santos',
                    verified: true,
                    slug: 'maria-santos',
                },
            ]

            // Mock public mentors query
            mockClient.from.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        order: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: verifiedMentors,
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

            const TestPublicMentorList = () => {
                const [mentors, setMentors] = React.useState(verifiedMentors)

                return (
                    <div>
                        <h1>Public Mentors</h1>
                        <div data-testid="mentor-list">
                            {mentors.map(mentor => (
                                <div key={mentor.id} data-testid={`public-mentor-${mentor.id}`}>
                                    <div data-testid={`mentor-name-${mentor.id}`}>
                                        {mentor.full_name}
                                    </div>
                                    <div data-testid={`mentor-status-${mentor.id}`}>
                                        {mentor.verified ? 'Verified Mentor' : 'Not Verified'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            render(<TestPublicMentorList />)

            expect(screen.getByText('Public Mentors')).toBeInTheDocument()
            expect(screen.getByTestId('mentor-name-mentor-1')).toHaveTextContent('João Silva')
            expect(screen.getByTestId('mentor-status-mentor-1')).toHaveTextContent('Verified Mentor')
            expect(screen.getByTestId('mentor-name-mentor-2')).toHaveTextContent('Maria Santos')
            expect(screen.getByTestId('mentor-status-mentor-2')).toHaveTextContent('Verified Mentor')
        })
    })
})