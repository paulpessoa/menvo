import React, { createContext, useContext, useMemo } from 'react'
import { useAuth } from '@/lib/auth'

type UserRolesContextType = {
  roles: string[]
  isLoading: boolean
}

const UserRolesContext = createContext<UserRolesContextType>({ roles: [], isLoading: true })

export function UserRolesProvider({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  
  const value = useMemo(() => ({
    roles: profile?.roles || [],
    isLoading: loading
  }), [profile, loading])

  return (
    <UserRolesContext.Provider value={value}>
      {children}
    </UserRolesContext.Provider>
  )
}

export function useUserRoles() {
  return useContext(UserRolesContext)
}
