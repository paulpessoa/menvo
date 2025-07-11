import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface ProtectedContentProps {
  children: React.ReactNode
  requireMentor?: boolean
  className?: string
}

export function ProtectedContent({ children, requireMentor = false, className = '' }: ProtectedContentProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isMentor, setIsMentor] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          setIsAuthenticated(true)
          
          if (requireMentor) {
            const { data: userData } = await supabase
              .from('users')
              .select('user_type, status')
              .eq('id', session.user.id)
              .single()
            
            setIsMentor(userData?.user_type === 'mentor' && userData?.status === 'active')
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [requireMentor])

  if (isLoading) {
    return <div className="animate-pulse">{children}</div>
  }

  if (!isAuthenticated || (requireMentor && !isMentor)) {
    return (
      <div className={`relative ${className}`}>
        <div className="blur-sm pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              {!isAuthenticated 
                ? 'Please log in to access this feature'
                : 'This feature is only available for validated mentors'}
            </p>
            <Button 
              onClick={() => router.push('/login')}
              variant="default"
            >
              {!isAuthenticated ? 'Log In' : 'Become a Mentor'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
