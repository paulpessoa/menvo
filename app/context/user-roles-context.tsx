"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useUserProfile } from '@/hooks/useUserProfile'
import { user_role } from '@/types/database'

interface UserRolesContextType {
  userRole: user_role | null
  isAdmin: boolean
  isMentor: boolean
  isMentee: boolean
  isLoadingRoles: boolean
  primaryRole: user_role | null
}

const UserRolesContext = createContext<UserRolesContextType | undefined>(undefined)

export function UserRolesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { userProfile, loading: profileLoading } = useUserProfile(user?.id)
  const [userRole, setUserRole] = useState<user_role | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMentor, setIsMentor] = useState(false)
  const [isMentee, setIsMentee] = useState(false)
  const [primaryRole, setPrimaryRole] = useState<user_role | null>(null)

  const isLoadingRoles = authLoading || profileLoading

  useEffect(() => {
    if (!isLoadingRoles && userProfile) {
      const role = userProfile.role
      setUserRole(role)
      setIsAdmin(role === 'admin')
      setIsMentor(role === 'mentor')
      setIsMentee(role === 'mentee')
      setPrimaryRole(role) // Assuming the 'role' field is the primary one
    } else if (!isLoadingRoles && !userProfile) {
      // User is logged in but has no profile or is not logged in
      setUserRole(null)
      setIsAdmin(false)
      setIsMentor(false)
      setIsMentee(false)
      setPrimaryRole(null)
    }
  }, [isLoadingRoles, userProfile])

  return (
    <UserRolesContext.Provider
      value={{
        userRole,
        isAdmin,
        isMentor,
        isMentee,
        isLoadingRoles,
        primaryRole,
      }}
    >
      {children}
    </UserRolesContext.Provider>
  )
}

export function useUserRoles() {
  const context = useContext(UserRolesContext)
  if (context === undefined) {
    throw new Error('useUserRoles must be used within a UserRolesProvider')
  }
  return context
}

// Optional: convenience hooks for specific roles
export function useIsAdmin() {
  return useUserRoles().isAdmin
}

export function useIsMentor() {
  return useUserRoles().isMentor
}

export function useIsMentee() {
  return useUserRoles().isMentee
}

export function usePrimaryRole() {
  return useUserRoles().primaryRole
}
