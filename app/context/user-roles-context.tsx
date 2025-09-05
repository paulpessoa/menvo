import React, { createContext, useContext } from 'react'
import { useUserProfile } from '@/hooks/useUserProfile'
import { UserRoleType } from '@/lib/auth/auth-context'

type UserRolesContextType = {
  roles: UserRoleType[]
  isLoading: boolean
}

const UserRolesContext = createContext<UserRolesContextType>({ roles: [], isLoading: true })

export function UserRolesProvider({ children }: { children: React.ReactNode }) {
  const { data: profile, isLoading } = useUserProfile()
  const roles = profile?.roles || []
  return (
    <UserRolesContext.Provider value={{ roles, isLoading }}>
      {children}
    </UserRolesContext.Provider>
  )
}

export function useUserRoles() {
  return useContext(UserRolesContext)
}
