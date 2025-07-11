"use client"

import { useAuth } from "./useAuth"

export type Permission =
  | "view_mentors"
  | "book_sessions"
  | "provide_mentorship"
  | "manage_availability"
  | "admin_users"
  | "admin_verifications"
  | "admin_system"

export type Role = "mentee" | "mentor" | "admin"

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  mentee: ["view_mentors", "book_sessions"],
  mentor: ["view_mentors", "book_sessions", "provide_mentorship", "manage_availability"],
  admin: [
    "view_mentors",
    "book_sessions",
    "provide_mentorship",
    "manage_availability",
    "admin_users",
    "admin_verifications",
    "admin_system",
  ],
}

// Tipos de roles disponíveis
export type UserRoleType = 
  | 'viewer'           // Usuário não confirmado
  | 'mentor'          // Mentor
  | 'mentee'          // Mentorado
  | 'admin'           // Administrador
  | 'recruiter'       // Recrutador
  | 'company'         // Empresa
  | 'volunteer'       // Voluntário
  | 'content_manager' // Gestor de conteúdo
  | 'community_manager' // Gestor de comunidade
  | 'support_agent'   // Agente de suporte
  | 'analytics_manager' // Gestor de analytics

// Interface para permissões
export interface Permission {
  id: string
  name: string
  description: string
  roles: UserRoleType[]
}

// Lista de todas as permissões disponíveis
export const PERMISSIONS: Permission[] = [
  // Permissões básicas (viewer)
  {
    id: 'view_public_content',
    name: 'Visualizar conteúdo público',
    description: 'Permite visualizar conteúdo público da plataforma',
    roles: ['viewer', 'mentor', 'mentee', 'admin', 'recruiter', 'company', 'volunteer', 'content_manager', 'community_manager', 'support_agent', 'analytics_manager']
  },

  // Permissões de mentoria
  {
    id: 'manage_mentorship',
    name: 'Gerenciar mentorias',
    description: 'Permite gerenciar sessões de mentoria',
    roles: ['mentor', 'mentee', 'admin']
  },
  {
    id: 'view_mentors',
    name: 'Visualizar mentores',
    description: 'Permite visualizar lista de mentores',
    roles: ['viewer', 'mentee', 'admin', 'recruiter', 'company']
  },
  {
    id: 'view_mentees',
    name: 'Visualizar mentorados',
    description: 'Permite visualizar lista de mentorados',
    roles: ['mentor', 'admin']
  },

  // Permissões de perfil
  {
    id: 'manage_profile',
    name: 'Gerenciar perfil',
    description: 'Permite gerenciar informações do perfil',
    roles: ['mentor', 'mentee', 'admin', 'recruiter', 'company', 'volunteer', 'content_manager', 'community_manager', 'support_agent', 'analytics_manager']
  },
  {
    id: 'view_private_profiles',
    name: 'Visualizar perfis privados',
    description: 'Permite visualizar informações privadas dos perfis',
    roles: ['admin', 'recruiter', 'company']
  },

  // Permissões administrativas
  {
    id: 'manage_users',
    name: 'Gerenciar usuários',
    description: 'Permite gerenciar usuários da plataforma',
    roles: ['admin']
  },
  {
    id: 'manage_roles',
    name: 'Gerenciar roles',
    description: 'Permite gerenciar roles e permissões',
    roles: ['admin']
  },
  {
    id: 'view_analytics',
    name: 'Visualizar analytics',
    description: 'Permite visualizar dados analíticos',
    roles: ['admin', 'analytics_manager']
  },

  // Permissões de conteúdo
  {
    id: 'manage_content',
    name: 'Gerenciar conteúdo',
    description: 'Permite gerenciar conteúdo da plataforma',
    roles: ['admin', 'content_manager']
  },
  {
    id: 'moderate_content',
    name: 'Moderar conteúdo',
    description: 'Permite moderar conteúdo da comunidade',
    roles: ['admin', 'volunteer', 'community_manager']
  },

  // Permissões de suporte
  {
    id: 'manage_support',
    name: 'Gerenciar suporte',
    description: 'Permite gerenciar tickets de suporte',
    roles: ['admin', 'support_agent']
  }
]

export function usePermissions() {
  const { user } = useAuth()

  const hasPermission = (permission: Permission): boolean => {
    if (!user?.user_metadata?.role) return false
    return ROLE_PERMISSIONS[user.user_metadata.role as Role]?.includes(permission) || false
  }

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some((permission) => hasPermission(permission))
  }

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every((permission) => hasPermission(permission))
  }

  const canViewMentors = hasPermission("view_mentors")
  const canBookSessions = hasPermission("book_sessions")
  const canProvideMentorship = hasPermission("provide_mentorship")
  const canManageAvailability = hasPermission("manage_availability")
  const canAdminUsers = hasPermission("admin_users")
  const canAdminVerifications = hasPermission("admin_verifications")
  const canAdminSystem = hasPermission("admin_system")

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canViewMentors,
    canBookSessions,
    canProvideMentorship,
    canManageAvailability,
    canAdminUsers,
    canAdminVerifications,
    canAdminSystem,
  }
}
