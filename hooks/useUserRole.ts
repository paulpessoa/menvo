import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { createClient } from '@/utils/supabase/client'
import { UserType } from './useSignupForm'

export function useUserRole() {
  const { user, refreshProfile } = useAuth()
  const [userRole, setUserRole] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Buscar role do usuário
  const fetchUserRole = async () => {
    if (!user) {
      setUserRole(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Primeiro, tentar pegar do JWT (mais rápido)
      const jwtRole = user.user_metadata?.role as UserType
      
      if (jwtRole) {
        setUserRole(jwtRole)
        setLoading(false)
        return
      }

      // Se não estiver no JWT, buscar do banco
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (dbError) {
        console.error('Error fetching user role:', dbError)
        setError('Erro ao buscar role do usuário')
        setUserRole(null)
      } else {
        setUserRole(data?.role as UserType || null)
      }
    } catch (err) {
      console.error('Error in fetchUserRole:', err)
      setError('Erro inesperado ao buscar role')
      setUserRole(null)
    } finally {
      setLoading(false)
    }
  }

  // Atualizar role do usuário
  const updateUserRole = async (newRole: UserType) => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    try {
      setLoading(true)
      setError(null)

      // Salvar na tabela profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email!,
          role: newRole,
          status: 'pending',
          updated_at: new Date().toISOString(),
        })

      if (profileError) {
        throw new Error(`Erro ao salvar role no perfil: ${profileError.message}`)
      }

      // Atualizar o custom access token
      const { error: tokenError } = await supabase.auth.updateUser({
        data: { role: newRole }
      })

      if (tokenError) {
        throw new Error(`Erro ao atualizar token: ${tokenError.message}`)
      }

      // Atualizar estado local
      setUserRole(newRole)
      
      // Atualizar perfil do usuário
      await refreshProfile()

      return { success: true }
    } catch (err: any) {
      console.error('Error updating user role:', err)
      setError(err.message || 'Erro ao atualizar role')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Verificar se usuário tem role específica
  const hasRole = (role: UserType) => {
    return userRole === role
  }

  // Verificar se usuário tem qualquer role
  const hasAnyRole = () => {
    return userRole !== null
  }

  // Buscar role quando usuário muda
  useEffect(() => {
    fetchUserRole()
  }, [user])

  return {
    userRole,
    loading,
    error,
    updateUserRole,
    hasRole,
    hasAnyRole,
    refreshRole: fetchUserRole,
  }
} 