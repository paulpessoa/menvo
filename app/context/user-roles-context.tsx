'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useUserProfile } from '@/hooks/useUserProfile'
import { Database } from '@/types/database'

type UserRole = Database['public']['Enums']['user_role'] | null;

interface UserRolesContextType {
  userRole: UserRole;
  isAdmin: boolean;
  isMentor: boolean;
  isMentee: boolean;
  isLoadingRoles: boolean;
}

const UserRolesContext = createContext<UserRolesContextType | undefined>(undefined)

export const UserRolesProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth()
  const { userProfile, loading: profileLoading } = useUserProfile(user?.id)
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMentor, setIsMentor] = useState(false)
  const [isMentee, setIsMentee] = useState(false)
  const [isLoadingRoles, setIsLoadingRoles] = useState(true)

  useEffect(() => {
    if (!authLoading && !profileLoading) {
      if (user && userProfile) {
        const role = userProfile.role
        setUserRole(role)
        setIsAdmin(role === 'admin')
        setIsMentor(role === 'mentor')
        setIsMentee(role === 'mentee')
      } else {
        // No user or profile, reset roles
        setUserRole(null)
        setIsAdmin(false)
        setIsMentor(false)
        setIsMentee(false)
      }
      setIsLoadingRoles(false)
    } else {
      setIsLoadingRoles(true)
    }
  }, [user, userProfile, authLoading, profileLoading])

  return (
    <UserRolesContext.Provider
      value={{
        userRole,
        isAdmin,
        isMentor,
        isMentee,
        isLoadingRoles,
      }}
    >
      {children}
    </UserRolesContext.Provider>
  )
}

export const useUserRoles = () => {
  const context = useContext(UserRolesContext)
  if (context === undefined) {
    throw new Error('useUserRoles must be used within a UserRolesProvider')
  }
  return context
}
