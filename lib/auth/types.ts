export interface User {
  id: string
  email?: string
  user_metadata?: Record<string, any>
  app_metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
  email_confirmed_at?: string
}

export interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  role: "pending" | "mentee" | "mentor" | "admin" | "volunteer" | "moderator"
  status: "pending" | "active" | "suspended" | "rejected"
  verification_status: "pending" | "verified" | "rejected"
  created_at: string
  updated_at: string
}

export interface SignUpData {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface CompleteProfileData {
  firstName: string
  lastName: string
  role: "mentee" | "mentor" | "volunteer"
}

export interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
}

export interface AuthError {
  message: string
  status?: number
}
