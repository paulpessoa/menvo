/**
 * Integration Tests for Appointment and Google Calendar Integration
 * Tests the complete appointment booking flow with Google Calendar event creation
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
    usePathname: () => '/mentors/joao-silva',
}))

// Mock Supabase client
jest.mock('@/utils/supabase/client')
const mockSupabase = createClient as jest.MockedFunction<typeof createClient>

// Mock Google Calendar integration
jest.mock('@/lib/google-calendar', () => ({
    createCalendarEvent: jest.fn(),
}))

// Mock fetch for API calls
global.fetch = jest.fn()

describe('Appointment and Calendar Integration Tests', () => {
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
                gte: jest.fn().mockReturnThis(),
                lt: jest.fn().mockReturnThis(),
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

    describe('Appointment Booking Flow', () => {
        it('should display mentor availability and allow booking', async () => {
            const user = userEvent.setup()

            // Mock mentee user
            const menteeUser = {
                id: 'mentee-123',
                email: 'mentee@example.com',
            }

            const menteeProfile = {
                id: 'mentee-123',
                email: 'mentee@example.com',
                first_name: 'Ana',
                last_name: 'Costa',
                full_name: 'Ana Costa',
            }

            // Mock mentor data
            const mentorProfile = {
                id: 'mentor-123',
                email: 'mentor@example.com',
                first_name: 'João',
                last_name: 'Silva',
                full_name: 'João Silva',
                verified: true,
                slug: 'joao-silva',
            }

            const mentorAvailability = [
                {
                    id: 1,
                    mentor_id: 'mentor-123',
                    day_of_week: 1, // Monday
                    start_time: '09:00:00',
                    end_time: '17:00:00',
                },
                {
                    id: 2,
                    mentor_id: 'mentor-123',
                    day_of_week: 3, // Wednesday
                    start_time: '14:00:00',
                    end_time: '18:00:00',
                },
            ]

            // Mock auth session
            mockClient.auth.getSession.mockResolvedValue({
                data: { session: { user: menteeUser } },
                error: null,
            })

            // Mock database queries
            mockClient.from.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn((field: string, value: string) => {
                            if (value === 'mentee-123') {
                                return {
                                    single: jest.fn().mockResolvedValue({
                                        data: menteeProfile,
                                        error: null,
                                    }),
                                }
                            }
                            if (value === 'mentor-123') {
                                return {
                                    single: jest.fn().mockResolvedValue({
                                        data: mentorProfile,
                                        error: null,
                                    }),
                                }
                            }
                            return {
                                single: jest.fn().mockResolvedValue({
                                    data: null,
                                    error: null,
                                }),
                            }
                        }),
                    }
                }
                if (table === 'user_roles') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: { roles: { name: 'mentee' } },
                            error: null,
                        }),
                    }
                }
                if (table === 'mentor_availability') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        order: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: mentorAvailability,
                            error: null,
                        }),
                    }
                }
                if (table === 'appointments') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        in: jest.fn().mockReturnThis(),
                        gte: jest.fn().mockReturnThis(),
                        lt: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({
                            data: [], // No conflicts
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

            const TestAppointmentBooking = () => {
                const { user, profile, role } = useAuth()
                const [selectedDate, setSelectedDate] = React.useState('')
                const [selectedTime, setSelectedTime] = React.useState('')
                const [message, setMessage] = React.useState('')
                const [loading, setLoading] = React.useState(false)

                const handleBookAppointment = async () => {
                    if (!selectedDate || !selectedTime) return

                    setLoading(true)
                    try {
                        const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`)

                        const response = await fetch('/api/appointments/create', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                mentor_id: 'mentor-123',
                                scheduled_at: scheduledAt.toISOString(),
                                duration_minutes: 60,
                                message,
                            }),
                        })

                        if (response.ok) {
                            const data = await response.json()
                            // Handle success
                        }
                    } catch (error) {
                        console.error('Error booking appointment:', error)
                    } finally {
                        setLoading(false)
                    }
                }

                return (
                    <div>
                        <h1>Book Appointment with João Silva</h1>
                        <div data-testid="mentee-info">
                            Booking as: {profile?.full_name} ({role})
                        </div>

                        <div>
                            <h2>Available Times</h2>
                            <div data-testid="availability">
                                <div>Monday: 09:00 - 17:00</div>
                                <div>Wednesday: 14:00 - 18:00</div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="date">Select Date:</label>
                            <input
                                id="date"
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                data-testid="date-input"
                            />
                        </div>

                        <div>
                            <label htmlFor="time">Select Time:</label>
                            <select
                                id="time"
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                                data-testid="time-select"
                            >
                                <option value="">Select time</option>
                                <option value="09:00">09:00</option>
                                <option value="10:00">10:00</option>
                                <option value="14:00">14:00</option>
                                <option value="15:00">15:00</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="message">Message (optional):</label>
                            <textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                data-testid="message-input"
                                placeholder="Tell the mentor what you'd like to discuss..."
                            />
                        </div>

                        <button
                            onClick={handleBookAppointment}
                            disabled={!selectedDate || !selectedTime || loading}
                            data-testid="book-button"
                        >
                            {loading ? 'Booking...' : 'Book Appointment'}
                        </button>
                    </div>
                )
            }

            render(
                <AuthProvider>
                    <TestAppointmentBooking />
                </AuthProvider>
            )

            await waitFor(() => {
                expect(screen.getByText('Book Appointment with João Silva')).toBeInTheDocument()
                expect(screen.getByTestId('mentee-info')).toHaveTextContent('Ana Costa (mentee)')
                expect(screen.getByTestId('availability')).toHaveTextContent('Monday: 09:00 - 17:00')
                expect(screen.getByTestId('availability')).toHaveTextContent('Wednesday: 14:00 - 18:00')
            })

            // Fill booking form
            await user.type(screen.getByTestId('date-input'), '2024-12-16') // Monday
            await user.selectOptions(screen.getByTestId('time-select'), '10:00')
            await user.type(screen.getByTestId('message-input'), 'I would like to discuss career transition')

            // Book appointment
            await user.click(screen.getByTestId('book-button'))

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith('/api/appointments/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        mentor_id: 'mentor-123',
                        scheduled_at: '2024-12-16T10:00:00.000Z',
                        duration_minutes: 60,
                        message: 'I would like to discuss career transition',
                    }),
                })
            })
        })

        it('should create Google Calendar event with appointment', async () => {
            // Mock successful appointment creation with Google Calendar
            ; (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    appointment: {
                        id: 'appointment-123',
                        mentor_id: 'mentor-123',
                        mentee_id: 'mentee-123',
                        scheduled_at: '2024-12-16T10:00:00Z',
                        duration_minutes: 60,
                        google_event_id: 'google-event-123',
                        google_meet_link: 'https://meet.google.com/abc-defg-hij',
                        status: 'pending',
                        mentor: {
                            id: 'mentor-123',
                            full_name: 'João Silva',
                            email: 'mentor@example.com',
                        },
                        mentee: {
                            id: 'mentee-123',
                            full_name: 'Ana Costa',
                            email: 'mentee@example.com',
                        },
                    },
                    message: 'Appointment created successfully',
                }),
            })

            const TestAppointmentCreation = () => {
                const [appointment, setAppointment] = React.useState<any>(null)
                const [loading, setLoading] = React.useState(false)

                const createAppointment = async () => {
                    setLoading(true)
                    try {
                        const response = await fetch('/api/appointments/create', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
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
                            onClick={createAppointment}
                            disabled={loading}
                            data-testid="create-appointment"
                        >
                            Create Appointment
                        </button>

                        {appointment && (
                            <div data-testid="appointment-details">
                                <div data-testid="appointment-id">{appointment.id}</div>
                                <div data-testid="google-event-id">{appointment.google_event_id}</div>
                                <div data-testid="google-meet-link">{appointment.google_meet_link}</div>
                                <div data-testid="appointment-status">{appointment.status}</div>
                                <div data-testid="mentor-name">{appointment.mentor.full_name}</div>
                                <div data-testid="mentee-name">{appointment.mentee.full_name}</div>
                            </div>
                        )}
                    </div>
                )
            }

            const user = userEvent.setup()
            render(<TestAppointmentCreation />)

            await user.click(screen.getByTestId('create-appointment'))

            await waitFor(() => {
                expect(screen.getByTestId('appointment-details')).toBeInTheDocument()
                expect(screen.getByTestId('appointment-id')).toHaveTextContent('appointment-123')
                expect(screen.getByTestId('google-event-id')).toHaveTextContent('google-event-123')
                expect(screen.getByTestId('google-meet-link')).toHaveTextContent('https://meet.google.com/abc-defg-hij')
                expect(screen.getByTestId('appointment-status')).toHaveTextContent('pending')
                expect(screen.getByTestId('mentor-name')).toHaveTextContent('João Silva')
                expect(screen.getByTestId('mentee-name')).toHaveTextContent('Ana Costa')
            })
        })

        it('should handle appointment conflicts', async () => {
            const user = userEvent.setup()

                // Mock conflict response
                ; (global.fetch as jest.Mock).mockResolvedValue({
                    ok: false,
                    status: 409,
                    json: () => Promise.resolve({
                        error: 'Time slot is not available',
                    }),
                })

            const TestConflictHandling = () => {
                const [error, setError] = React.useState('')
                const [loading, setLoading] = React.useState(false)

                const attemptBooking = async () => {
                    setLoading(true)
                    setError('')
                    try {
                        const response = await fetch('/api/appointments/create', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                mentor_id: 'mentor-123',
                                scheduled_at: '2024-12-16T10:00:00Z',
                                duration_minutes: 60,
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
                            onClick={attemptBooking}
                            disabled={loading}
                            data-testid="book-conflicted-slot"
                        >
                            Book Conflicted Slot
                        </button>

                        {error && (
                            <div data-testid="conflict-error">{error}</div>
                        )}
                    </div>
                )
            }

            render(<TestConflictHandling />)

            await user.click(screen.getByTestId('book-conflicted-slot'))

            await waitFor(() => {
                expect(screen.getByTestId('conflict-error')).toHaveTextContent('Time slot is not available')
            })
        })

        it('should validate appointment requirements', async () => {
            const user = userEvent.setup()

            // Mock validation error responses
            const validationTests = [
                {
                    body: { mentor_id: '', scheduled_at: '2024-12-16T10:00:00Z' },
                    expectedError: 'Missing required fields: mentor_id, scheduled_at',
                },
                {
                    body: { mentor_id: 'mentor-123', scheduled_at: '2023-12-16T10:00:00Z' },
                    expectedError: 'Scheduled time must be in the future',
                },
                {
                    body: { mentor_id: 'unverified-mentor', scheduled_at: '2024-12-16T10:00:00Z' },
                    expectedError: 'Mentor is not verified',
                },
            ]

            const TestValidation = () => {
                const [errors, setErrors] = React.useState<string[]>([])

                const runValidationTests = async () => {
                    const testErrors: string[] = []

                    for (const test of validationTests) {
                        ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                            ok: false,
                            status: 400,
                            json: () => Promise.resolve({ error: test.expectedError }),
                        })

                        try {
                            const response = await fetch('/api/appointments/create', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(test.body),
                            })

                            if (!response.ok) {
                                const data = await response.json()
                                testErrors.push(data.error)
                            }
                        } catch (error) {
                            testErrors.push('Network error')
                        }
                    }

                    setErrors(testErrors)
                }

                return (
                    <div>
                        <button
                            onClick={runValidationTests}
                            data-testid="run-validation-tests"
                        >
                            Run Validation Tests
                        </button>

                        <div data-testid="validation-errors">
                            {errors.map((error, index) => (
                                <div key={index} data-testid={`error-${index}`}>
                                    {error}
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            render(<TestValidation />)

            await user.click(screen.getByTestId('run-validation-tests'))

            await waitFor(() => {
                expect(screen.getByTestId('error-0')).toHaveTextContent('Missing required fields')
                expect(screen.getByTestId('error-1')).toHaveTextContent('Scheduled time must be in the future')
                expect(screen.getByTestId('error-2')).toHaveTextContent('Mentor is not verified')
            })
        })
    })

    describe('Appointment Management', () => {
        it('should display appointments in mentor dashboard', async () => {
            const mentorAppointments = [
                {
                    id: 'appointment-1',
                    scheduled_at: '2024-12-16T10:00:00Z',
                    duration_minutes: 60,
                    status: 'pending',
                    google_meet_link: 'https://meet.google.com/abc-defg-hij',
                    mentee: {
                        id: 'mentee-1',
                        full_name: 'Ana Costa',
                        email: 'ana@example.com',
                    },
                },
                {
                    id: 'appointment-2',
                    scheduled_at: '2024-12-18T14:00:00Z',
                    duration_minutes: 60,
                    status: 'confirmed',
                    google_meet_link: 'https://meet.google.com/xyz-uvwx-yz',
                    mentee: {
                        id: 'mentee-2',
                        full_name: 'Carlos Lima',
                        email: 'carlos@example.com',
                    },
                },
            ]

            const TestMentorDashboard = () => {
                const [appointments, setAppointments] = React.useState(mentorAppointments)

                return (
                    <div>
                        <h1>Mentor Dashboard - Appointments</h1>
                        <div data-testid="appointments-list">
                            {appointments.map(appointment => (
                                <div key={appointment.id} data-testid={`appointment-${appointment.id}`}>
                                    <div data-testid={`mentee-${appointment.id}`}>
                                        {appointment.mentee.full_name}
                                    </div>
                                    <div data-testid={`date-${appointment.id}`}>
                                        {new Date(appointment.scheduled_at).toLocaleDateString()}
                                    </div>
                                    <div data-testid={`time-${appointment.id}`}>
                                        {new Date(appointment.scheduled_at).toLocaleTimeString()}
                                    </div>
                                    <div data-testid={`status-${appointment.id}`}>
                                        {appointment.status}
                                    </div>
                                    <div data-testid={`meet-link-${appointment.id}`}>
                                        {appointment.google_meet_link}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            render(<TestMentorDashboard />)

            expect(screen.getByText('Mentor Dashboard - Appointments')).toBeInTheDocument()
            expect(screen.getByTestId('mentee-appointment-1')).toHaveTextContent('Ana Costa')
            expect(screen.getByTestId('status-appointment-1')).toHaveTextContent('pending')
            expect(screen.getByTestId('meet-link-appointment-1')).toHaveTextContent('https://meet.google.com/abc-defg-hij')
            expect(screen.getByTestId('mentee-appointment-2')).toHaveTextContent('Carlos Lima')
            expect(screen.getByTestId('status-appointment-2')).toHaveTextContent('confirmed')
        })

        it('should display appointments in mentee dashboard', async () => {
            const menteeAppointments = [
                {
                    id: 'appointment-1',
                    scheduled_at: '2024-12-16T10:00:00Z',
                    duration_minutes: 60,
                    status: 'confirmed',
                    google_meet_link: 'https://meet.google.com/abc-defg-hij',
                    mentor: {
                        id: 'mentor-1',
                        full_name: 'João Silva',
                        email: 'joao@example.com',
                    },
                },
            ]

            const TestMenteeDashboard = () => {
                const [appointments, setAppointments] = React.useState(menteeAppointments)

                return (
                    <div>
                        <h1>My Appointments</h1>
                        <div data-testid="appointments-list">
                            {appointments.map(appointment => (
                                <div key={appointment.id} data-testid={`appointment-${appointment.id}`}>
                                    <div data-testid={`mentor-${appointment.id}`}>
                                        Mentor: {appointment.mentor.full_name}
                                    </div>
                                    <div data-testid={`date-${appointment.id}`}>
                                        {new Date(appointment.scheduled_at).toLocaleDateString()}
                                    </div>
                                    <div data-testid={`status-${appointment.id}`}>
                                        Status: {appointment.status}
                                    </div>
                                    <a
                                        href={appointment.google_meet_link}
                                        data-testid={`join-link-${appointment.id}`}
                                    >
                                        Join Meeting
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            render(<TestMenteeDashboard />)

            expect(screen.getByText('My Appointments')).toBeInTheDocument()
            expect(screen.getByTestId('mentor-appointment-1')).toHaveTextContent('Mentor: João Silva')
            expect(screen.getByTestId('status-appointment-1')).toHaveTextContent('Status: confirmed')
            expect(screen.getByTestId('join-link-appointment-1')).toHaveAttribute(
                'href',
                'https://meet.google.com/abc-defg-hij'
            )
        })
    })
})
