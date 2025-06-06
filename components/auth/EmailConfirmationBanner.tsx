import { useAuth } from "@/hooks/useAuth"
import { ResendConfirmationEmail } from "@/components/auth/ResendConfirmationEmail"

export function EmailConfirmationBanner() {
  const { user } = useAuth()
  if (!user) return null

  // Supabase: pode ser 'confirmed_at' ou 'email_confirmed'
  const isConfirmed = user.email_confirmed || user.confirmed_at

  if (isConfirmed) return null

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4 rounded">
      <p className="text-yellow-800">
        Seu e-mail ainda não foi confirmado. Por favor, verifique sua caixa de entrada e clique no link de confirmação.
      </p>
      <div className="mt-2">
        <ResendConfirmationEmail email={user.email} />
      </div>
    </div>
  )
} 