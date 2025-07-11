import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

const supabase = createClient()

// Get current user
export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        // Don't treat missing session as an error
        if (error && error.message === "Auth session missing!") {
          return { data: null }
        }

        if (error) {
          throw error
        }

        return { data: user }
      } catch (error) {
        // Handle auth session missing gracefully
        if (error instanceof Error && error.message.includes("Auth session missing")) {
          return { data: null }
        }
        throw error
      }
    },
    retry: false, // Don't retry auth errors
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Login mutation
export function useLogin() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      console.log("🔐 useLogin: Iniciando login para:", email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("❌ useLogin: Erro no login:", error.message)
        throw error
      }
      
      console.log("✅ useLogin: Login bem-sucedido para:", email)
      console.log("📋 useLogin: Dados da sessão:", {
        user: data.user?.email,
        session: !!data.session,
        accessToken: data.session?.access_token ? "PRESENTE" : "AUSENTE"
      })
      
      return data
    },
    onSuccess: (data) => {
      console.log("🎉 useLogin: onSuccess chamado")
      console.log("👤 useLogin: Usuário logado:", data.user?.email)
      
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
      console.log("🔄 useLogin: Queries invalidadas")
      
      // Redirecionar para home após login bem-sucedido
      console.log("🏠 useLogin: Redirecionando para home após login")
      router.push('/')
    },
    onError: (error) => {
      console.error("💥 useLogin: onError chamado:", error)
    },
    onSettled: () => {
      console.log("🏁 useLogin: onSettled chamado - mutação finalizada")
    }
  })
}

// Register mutation
export function useRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userData: any) => {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            user_type: userData.user_type,
          },
        },
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
    },
  })
}

// Logout mutation
export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear()
      
      // Redirecionar para home após logout
      console.log("🏠 useLogout: Redirecionando para home após logout")
      router.push('/')
    },
  })
}

// Update profile mutation
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: any) => {
      const { data, error } = await supabase.auth.updateUser(updates)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
    },
  })
}
