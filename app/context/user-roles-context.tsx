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
  const { userRole, isAdmin, isMentor, isMentee, isLoading: authLoading } = useAuth()
  // userProfile is fetched based on the user ID from useAuth, not userRole directly
  const { userProfile, loading: profileLoading } = useUserProfile(userRole?.user_id) // Assuming userRole has user_id if it's not null
  const [primaryRole, setPrimaryRole] = useState<user_role | null>(null)

  const isLoadingRoles = authLoading || profileLoading

  useEffect(() => {
    if (!isLoadingRoles && userProfile) {
      setPrimaryRole(userProfile.role) // Assuming the 'role' field is the primary one
    } else if (!isLoadingRoles && !userProfile) {
      // User is logged in but has no profile or is not logged in
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

export const useUserRoles = () => {
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
