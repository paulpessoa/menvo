import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/auth/login-form'
import { useAuth } from '@/lib/auth'

// Mock auth hook
jest.mock('@/lib/auth')
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('LoginForm', () => {
    const mockSignIn = jest.fn()
    const mockSignInWithProvider = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
        mockUseAuth.mockReturnValue({
            user: null,
            profile: null,
            role: null,
            isVerified: false,
            loading: false,
            signIn: mockSignIn,
            signUp: jest.fn(),
            signInWithProvider: mockSignInWithProvider,
            signOut: jest.fn(),
            selectRole: jest.fn(),
            refreshProfile: jest.fn(),
        })
    })

    it('should render login form elements', () => {
        render(<LoginForm />)

        expect(screen.getByText('Bem-vindo')).toBeInTheDocument()
        expect(screen.getByText('Entre na sua conta para continuar')).toBeInTheDocument()
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
    })

    it('should validate email format', async () => {
        const user = userEvent.setup()
        render(<LoginForm />)

        const emailInput = screen.getByLabelText(/email/i)
        const submitButton = screen.getByRole('button', { name: /entrar/i })

        await user.type(emailInput, 'invalid-email')
        await user.click(submitButton)

        // HTML5 validation should prevent submission
        expect(mockSignIn).not.toHaveBeenCalled()
    })

    it('should require password', async () => {
        const user = userEvent.setup()
        render(<LoginForm />)

        const emailInput = screen.getByLabelText(/email/i)
        const submitButton = screen.getByRole('button', { name: /entrar/i })

        await user.type(emailInput, 'test@example.com')
        await user.click(submitButton)

        // Should not submit without password
        expect(mockSignIn).not.toHaveBeenCalled()
    })

    it('should submit form with valid credentials', async () => {
        const user = userEvent.setup()
        mockSignIn.mockResolvedValue(undefined)

        render(<LoginForm />)

        const emailInput = screen.getByLabelText(/email/i)
        const passwordInput = screen.getByLabelText(/senha/i)
        const submitButton = screen.getByRole('button', { name: /entrar/i })

        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'password123')
        await user.click(submitButton)

        await waitFor(() => {
            expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
        })
    })

    it('should show loading state during submission', async () => {
        const user = userEvent.setup()
        mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

        render(<LoginForm />)

        const emailInput = screen.getByLabelText(/email/i)
        const passwordInput = screen.getByLabelText(/senha/i)
        const submitButton = screen.getByRole('button', { name: /entrar/i })

        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'password123')
        await user.click(submitButton)

        expect(submitButton).toBeDisabled()
        expect(screen.getByText(/entrando/i)).toBeInTheDocument()
    })

    it('should handle email not confirmed error', async () => {
        const user = userEvent.setup()
        mockSignIn.mockRejectedValue(new Error('Email not confirmed'))

        render(<LoginForm />)

        const emailInput = screen.getByLabelText(/email/i)
        const passwordInput = screen.getByLabelText(/senha/i)
        const submitButton = screen.getByRole('button', { name: /entrar/i })

        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'password123')
        await user.click(submitButton)

        await waitFor(() => {
            expect(screen.getByText(/confirme seu email/i)).toBeInTheDocument()
        })
    })

    it('should handle invalid credentials error', async () => {
        const user = userEvent.setup()
        mockSignIn.mockRejectedValue(new Error('Invalid login credentials'))

        render(<LoginForm />)

        const emailInput = screen.getByLabelText(/email/i)
        const passwordInput = screen.getByLabelText(/senha/i)
        const submitButton = screen.getByRole('button', { name: /entrar/i })

        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'wrongpassword')
        await user.click(submitButton)

        await waitFor(() => {
            expect(screen.getByText(/email ou senha incorretos/i)).toBeInTheDocument()
        })
    })

    it('should handle Google login', async () => {
        const user = userEvent.setup()
        mockSignInWithProvider.mockResolvedValue(undefined)

        render(<LoginForm />)

        const googleButton = screen.getByRole('button', { name: /continuar com google/i })
        await user.click(googleButton)

        await waitFor(() => {
            expect(mockSignInWithProvider).toHaveBeenCalledWith('google')
        })
    })

    it('should handle LinkedIn login', async () => {
        const user = userEvent.setup()
        mockSignInWithProvider.mockResolvedValue(undefined)

        render(<LoginForm />)

        const linkedinButton = screen.getByRole('button', { name: /continuar com linkedin/i })
        await user.click(linkedinButton)

        await waitFor(() => {
            expect(mockSignInWithProvider).toHaveBeenCalledWith('linkedin')
        })
    })

    it('should disable social buttons during form submission', async () => {
        const user = userEvent.setup()
        mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

        render(<LoginForm />)

        const emailInput = screen.getByLabelText(/email/i)
        const passwordInput = screen.getByLabelText(/senha/i)
        const submitButton = screen.getByRole('button', { name: /entrar/i })
        const googleButton = screen.getByRole('button', { name: /continuar com google/i })

        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'password123')
        await user.click(submitButton)

        expect(googleButton).toBeDisabled()
    })

    it('should call onSuccess callback after successful login', async () => {
        const user = userEvent.setup()
        const mockOnSuccess = jest.fn()
        mockSignIn.mockResolvedValue(undefined)

        render(<LoginForm onSuccess={mockOnSuccess} />)

        const emailInput = screen.getByLabelText(/email/i)
        const passwordInput = screen.getByLabelText(/senha/i)
        const submitButton = screen.getByRole('button', { name: /entrar/i })

        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'password123')
        await user.click(submitButton)

        await waitFor(() => {
            expect(mockOnSuccess).toHaveBeenCalled()
        })
    })

    it('should clear error when user starts typing', async () => {
        const user = userEvent.setup()
        mockSignIn.mockRejectedValue(new Error('Invalid login credentials'))

        render(<LoginForm />)

        const emailInput = screen.getByLabelText(/email/i)
        const passwordInput = screen.getByLabelText(/senha/i)
        const submitButton = screen.getByRole('button', { name: /entrar/i })

        // Trigger error
        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'wrongpassword')
        await user.click(submitButton)

        await waitFor(() => {
            expect(screen.getByText(/email ou senha incorretos/i)).toBeInTheDocument()
        })

        // Clear error by typing
        await user.clear(passwordInput)
        await user.type(passwordInput, 'newpassword')

        expect(screen.queryByText(/email ou senha incorretos/i)).not.toBeInTheDocument()
    })
})