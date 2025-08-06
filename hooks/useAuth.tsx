'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { useRouter, usePathname } from 'next/navigation'
import { Database } from '@/types/database'
import { useToast } from '@/components/ui/use-toast'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient<Database>()
  const { toast } = useToast()

  const fetchUser = useCallback(async () => {
    setIsLoading(true)
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Error fetching user:', error)
      setUser(null)
    } else {
      setUser(user)
    }
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchUser()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user || null)
          if (session?.user && event === 'SIGNED_IN') {
            // Check if profile is completed
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('profile_completed')
              .eq('id', session.user.id)
              .single()

            if (profileError) {
              console.error('Error fetching profile completion status:', profileError)
              // Handle error, maybe redirect to a generic error page or just proceed
            } else if (!profile?.profile_completed && pathname !== '/welcome') {
              router.push('/welcome')
            } else if (pathname === '/welcome' && profile?.profile_completed) {
              router.push('/dashboard') // Redirect if already completed and on welcome page
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          router.push('/login')
        }
        setIsLoading(false)
      }
    )

    return () => {
      authListener.unsubscribe()
    }
  }, [fetchUser, router, supabase, pathname])

  const signOut = useCallback(async () => {
    setIsLoading(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      toast({
        title: 'Sign Out Failed',
        description: 'There was an error signing you out. Please try again.',
        variant: 'destructive',
      })
    } else {
      setUser(null)
      router.push('/login')
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      })
    }
    setIsLoading(false)
  }, [supabase, router, toast])

  const refreshUser = useCallback(async () => {
    await fetchUser()
  }, [fetchUser])

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
