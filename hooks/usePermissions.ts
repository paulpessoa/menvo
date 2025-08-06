import { useAuth } from '@/hooks/useAuth'
import { useUserProfile } from '@/hooks/useUserProfile'

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

// Hook para verificar permissões
export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth()
  const { data: userProfile } = useUserProfile()

  // Verifica se o usuário tem uma permissão específica
  const hasPermission = (permissionId: string): boolean => {
    if (!isAuthenticated || !userProfile) return false

    const permission = PERMISSIONS.find(p => p.id === permissionId)
    if (!permission) return false

    // Se o usuário não tem email confirmado, só tem acesso a permissões de viewer
    if (!user?.email_confirmed_at) {
      return permission.roles.includes('viewer')
    }

    // Verifica se alguma das roles do usuário tem a permissão
    return userProfile.roles.some(role => 
      permission.roles.includes(role)
    )
  }

  // Verifica se o usuário tem todas as permissões listadas
  const hasAllPermissions = (permissionIds: string[]): boolean => {
    return permissionIds.every(id => hasPermission(id))
  }

  // Verifica se o usuário tem pelo menos uma das permissões listadas
  const hasAnyPermission = (permissionIds: string[]): boolean => {
    return permissionIds.some(id => hasPermission(id))
  }

  // Retorna todas as permissões que o usuário tem acesso
  const getUserPermissions = (): Permission[] => {
    if (!isAuthenticated || !userProfile) return []

    return PERMISSIONS.filter(permission => 
      userProfile.roles.some(role => 
        permission.roles.includes(role)
      )
    )
  }

  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    getUserPermissions
  }
}

// Hook para verificar se o usuário precisa confirmar email
export const useEmailConfirmation = () => {
  const { user } = useAuth()
  
  const needsEmailConfirmation = () => {
    return user && !user.email_confirmed_at
  }

  return {
    needsEmailConfirmation
  }
}
