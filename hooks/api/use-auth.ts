import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/utils/supabase/client"

interface SignUpData {
  email: string
  password: string
  fullName: string
  userType: string
}

interface SignInData {
  email: string
  password: string
}

export const useSignUp = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: SignUpData) => {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro no registro")
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user"] })
    }
  })
}

export const useSignIn = () => {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (data: SignInData) => {
      const { data: result, error } = await supabase.auth.signInWithPassword({
        email: data.email.toLowerCase().trim(),
        password: data.password
      })

      if (error) {
        throw new Error(error.message)
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user"] })
    }
  })
}

export const useSignOut = () => {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      queryClient.clear()
    }
  })
}

export const useCurrentUser = () => {
  const supabase = createClient()

  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const {
        data: { user },
        error
      } = await supabase.auth.getUser()

      if (error || !user) {
        return null
      }

      // Buscar perfil
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      return {
        user,
        profile
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

export const useOAuth = () => {
  const supabase = createClient()

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent"
        }
      }
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  const signInWithLinkedIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "linkedin_oidc",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: "consent"
        }
      }
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  return {
    signInWithGoogle,
    signInWithLinkedIn
  }
}
