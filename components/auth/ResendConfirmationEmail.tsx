import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { auth } from '@/services/auth/supabase'

interface ResendConfirmationEmailProps {
  email: string
}

export function ResendConfirmationEmail({ email }: ResendConfirmationEmailProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleResend = async () => {
    try {
      setIsLoading(true)
      await auth.resendConfirmationEmail(email)
      setMessage('Confirmation email sent! Please check your inbox.')
    } catch (error: any) {
      setMessage(error.message || 'Failed to resend confirmation email')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Didn't receive the confirmation email?
      </p>
      <Button
        onClick={handleResend}
        disabled={isLoading}
        variant="outline"
        className="w-full"
      >
        {isLoading ? 'Sending...' : 'Resend Confirmation Email'}
      </Button>
      {message && (
        <p className={`text-sm ${message.includes('Failed') ? 'text-red-500' : 'text-green-500'}`}>
          {message}
        </p>
      )}
    </div>
  )
} 