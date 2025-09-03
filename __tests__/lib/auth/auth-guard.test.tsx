import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { AuthGuard, RequireRole } from '@/lib/auth/auth-guard'
import { useAuth } from '@/lib/auth'

// Mock Next.js router
jest.mock('next/navigation')
const mockPush = jest.fn()
const mockRouter = useRouter as jest.MockedFunction<typeof useRouter>

// Mock auth hook
jest.mock('@/lib/auth')
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Test component
function TestContent() {
    return <div data-testid="protected-content">Protected Content</div>
}

describe('AuthGuard', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockRouter.mockReturnValue({
            push: mockPush,
            replace: jest.fn(),
            back: jest.fn(),
            forward: jest.fn(),
            refresh: jest.fn(),
            prefetch: jest.fn(),
        } as any)
    })

    describe('Basic Authentication', () => {
        it('should show loading when auth is loading', () => {
            mockUseAuth.mockReturnValue({
                user: null,
                profile: null,
                role: null,
                isVerified: false,
                loading: true,
                signIn: jest.fn(),
                signUp: jest.fn(),
                signInWithProvider: jest.fn(),
                signOut: jest.fn(),
                selectRole: jest.fn(),
                refreshProfile: jest.fn(),
            })

            render(
                <AuthGuard>
                    <TestContent />
                </AuthGuard>
            )

            expect(screen.getByText('Carregando...')).toBeInTheDocument()
        })

        it('should redirect to login when user is not authenticated', () => {
            mockUseAuth.mockReturnValue({
                user: null,
                profile: null,
                role: null,
                isVerified: false,
                loading: false,
                signIn: jest.fn(),
                signUp: jest.fn(),
                signInWithProvider: jest.fn(),
                signOut: jest.fn(),
                selectRole: jest.fn(),
                refreshProfile: jest.fn(),
            })

            render(
                <AuthGuard>
                    <TestContent />
                </AuthGuard>
            )

            expect(mockPush).toHaveBeenCalledWith('/auth/login')
        })

        it('should redirect to role selection when user has no role', () => {
            mockUseAuth.mockReturnValue({
                user: { id: '123', email: 'test@example.com' } as any,
                profile: { id: '123', full_name: 'Test User' } as any,
                role: null,
                isVerified: false,
                loading: false,
                signIn: jest.fn(),
                signUp: jest.fn(),
                signInWithProvider: jest.fn(),
                signOut: jest.fn(),
                selectRole: jest.fn(),
                refreshProfile: jest.fn(),
            })

            render(
                <AuthGuard requireRole>
                    <TestContent />
                </AuthGuard>
            )

            expect(mockPush).toHaveBeenCalledWith('/auth/select-role')
        })

        it('should show content when user is authenticated and has role', () => {
            mockUseAuth.mockReturnValue({
                user: { id: '123', email: 'test@example.com' } as any,
                profile: { id: '123', full_name: 'Test User' } as any,
                role: 'mentor',
                isVerified: true,
                loading: false,
                signIn: jest.fn(),
                signUp: jest.fn(),
                signInWithProvider: jest.fn(),
                signOut: jest.fn(),
                selectRole: jest.fn(),
                refreshProfile: jest.fn(),
            })

            render(
                <AuthGuard requireRole>
                    <TestContent />
                </AuthGuard>
            )

            expect(screen.getByTestId('protected-content')).toBeInTheDocument()
        })
    })

    describe('Role-based Access', () => {
        it('should allow access when user has allowed role', () => {
            mockUseAuth.mockReturnValue({
                user: { id: '123', email: 'test@example.com' } as any,
                profile: { id: '123', full_name: 'Test User' } as any,
                role: 'mentor',
                isVerified: true,
                loading: false,
                signIn: jest.fn(),
                signUp: jest.fn(),
                signInWithProvider: jest.fn(),
                signOut: jest.fn(),
                selectRole: jest.fn(),
                refreshProfile: jest.fn(),
            })

            render(
                <AuthGuard requireRole allowedRoles={['mentor', 'admin']}>
                    <TestContent />
                </AuthGuard>
            )

            expect(screen.getByTestId('protected-content')).toBeInTheDocument()
        })

        it('should redirect when user does not have allowed role', () => {
            mockUseAuth.mockReturnValue({
                user: { id: '123', email: 'test@example.com' } as any,
                profile: { id: '123', full_name: 'Test User' } as any,
                role: 'mentee',
                isVerified: false,
                loading: false,
                signIn: jest.fn(),
                signUp: jest.fn(),
                signInWithProvider: jest.fn(),
                signOut: jest.fn(),
                selectRole: jest.fn(),
                refreshProfile: jest.fn(),
            })

            render(
                <AuthGuard requireRole allowedRoles={['mentor', 'admin']}>
                    <TestContent />
                </AuthGuard>
            )

            expect(mockPush).toHaveBeenCalledWith('/dashboard')
        })
    })

    describe('Verification Requirements', () => {
        it('should allow access when verification is not required', () => {
            mockUseAuth.mockReturnValue({
                user: { id: '123', email: 'test@example.com' } as any,
                profile: { id: '123', full_name: 'Test User' } as any,
                role: 'mentor',
                isVerified: false,
                loading: false,
                signIn: jest.fn(),
                signUp: jest.fn(),
                signInWithProvider: jest.fn(),
                signOut: jest.fn(),
                selectRole: jest.fn(),
                refreshProfile: jest.fn(),
            })

            render(
                <AuthGuard requireRole>
                    <TestContent />
                </AuthGuard>
            )

            expect(screen.getByTestId('protected-content')).toBeInTheDocument()
        })

        it('should show verification message when verification is required but user is not verified', () => {
            mockUseAuth.mockReturnValue({
                user: { id: '123', email: 'test@example.com' } as any,
                profile: { id: '123', full_name: 'Test User' } as any,
                role: 'mentor',
                isVerified: false,
                loading: false,
                signIn: jest.fn(),
                signUp: jest.fn(),
                signInWithProvider: jest.fn(),
                signOut: jest.fn(),
                selectRole: jest.fn(),
                refreshProfile: jest.fn(),
            })

            render(
                <AuthGuard requireRole requireVerified>
                    <TestContent />
                </AuthGuard>
            )

            expect(screen.getByText(/aguardando verificação/i)).toBeInTheDocument()
        })

        it('should allow access when user is verified', () => {
            mockUseAuth.mockReturnValue({
                user: { id: '123', email: 'test@example.com' } as any,
                profile: { id: '123', full_name: 'Test User' } as any,
                role: 'mentor',
                isVerified: true,
                loading: false,
                signIn: jest.fn(),
                signUp: jest.fn(),
                signInWithProvider: jest.fn(),
                signOut: jest.fn(),
                selectRole: jest.fn(),
                refreshProfile: jest.fn(),
            })

            render(
                <AuthGuard requireRole requireVerified>
                    <TestContent />
                </AuthGuard>
            )

            expect(screen.getByTestId('protected-content')).toBeInTheDocument()
        })
    })
})

describe('RequireRole', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockRouter.mockReturnValue({
            push: mockPush,
            replace: jest.fn(),
            back: jest.fn(),
            forward: jest.fn(),
            refresh: jest.fn(),
            prefetch: jest.fn(),
        } as any)
    })

    it('should allow access for mentor role', () => {
        mockUseAuth.mockReturnValue({
            user: { id: '123', email: 'test@example.com' } as any,
            profile: { id: '123', full_name: 'Test User' } as any,
            role: 'mentor',
            isVerified: true,
            loading: false,
            signIn: jest.fn(),
            signUp: jest.fn(),
            signInWithProvider: jest.fn(),
            signOut: jest.fn(),
            selectRole: jest.fn(),
            refreshProfile: jest.fn(),
        })

        render(
            <RequireRole roles={['mentor']}>
                <TestContent />
            </RequireRole>
        )

        expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('should allow access for multiple roles', () => {
        mockUseAuth.mockReturnValue({
            user: { id: '123', email: 'test@example.com' } as any,
            profile: { id: '123', full_name: 'Test User' } as any,
            role: 'admin',
            isVerified: true,
            loading: false,
            signIn: jest.fn(),
            signUp: jest.fn(),
            signInWithProvider: jest.fn(),
            signOut: jest.fn(),
            selectRole: jest.fn(),
            refreshProfile: jest.fn(),
        })

        render(
            <RequireRole roles={['mentor', 'admin']}>
                <TestContent />
            </RequireRole>
        )

        expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('should redirect when user does not have required role', () => {
        mockUseAuth.mockReturnValue({
            user: { id: '123', email: 'test@example.com' } as any,
            profile: { id: '123', full_name: 'Test User' } as any,
            role: 'mentee',
            isVerified: false,
            loading: false,
            signIn: jest.fn(),
            signUp: jest.fn(),
            signInWithProvider: jest.fn(),
            signOut: jest.fn(),
            selectRole: jest.fn(),
            refreshProfile: jest.fn(),
        })

        render(
            <RequireRole roles={['mentor', 'admin']}>
                <TestContent />
            </RequireRole>
        )

        expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
})