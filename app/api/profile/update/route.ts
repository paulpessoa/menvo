import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { ErrorHandler } from '@/lib/error-handler'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Validation schemas
const profileValidation = {
  first_name: { required: true, minLength: 1, maxLength: 50 },
  last_name: { required: true, minLength: 1, maxLength: 50 },
  bio: { maxLength: 500 },
  age: { min: 13, max: 120 },
  city: { maxLength: 100 },
  state: { maxLength: 100 },
  country: { maxLength: 100 },
  timezone: { maxLength: 50 },
  job_title: { maxLength: 100 },
  company: { maxLength: 100 },
  experience_years: { min: 0, max: 70 },
  session_price_usd: { min: 0, max: 10000 },
  phone: { pattern: /^[\+]?[1-9][\d]{0,15}$/ },
  linkedin_url: { pattern: /^https:\/\/(www\.)?linkedin\.com\/.*$/ },
  github_url: { pattern: /^https:\/\/(www\.)?github\.com\/.*$/ },
  twitter_url: { pattern: /^https:\/\/(www\.)?(twitter\.com|x\.com)\/.*$/ },
  website_url: { pattern: /^https?:\/\/.*$/ }
}

function validateProfileData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  for (const [field, value] of Object.entries(data)) {
    const rules = profileValidation[field as keyof typeof profileValidation]
    if (!rules) continue
    
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors.push(`${field} é obrigatório`)
      continue
    }
    
    if (value === null || value === undefined || value === '') continue
    
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${field} deve ter pelo menos ${rules.minLength} caracteres`)
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} deve ter no máximo ${rules.maxLength} caracteres`)
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${field} tem formato inválido`)
      }
    }
    
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${field} deve ser pelo menos ${rules.min}`)
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${field} deve ser no máximo ${rules.max}`)
      }
    }
  }
  
  return { isValid: errors.length === 0, errors }
}

export async function PUT(request: NextRequest) {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(7)
  
  try {
    logger.info("Profile update started", { requestId })

    // Verificar autenticação
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      logger.warn("Missing authorization header", { requestId })
      return ErrorHandler.handleApiError(
        new Error("Token de autorização necessário"),
        "AUTH_MISSING",
        401
      )
    }

    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      logger.warn("Authentication failed", { requestId, error: authError })
      return ErrorHandler.handleApiError(
        authError || new Error("Token inválido"),
        "AUTH_INVALID",
        401
      )
    }

    logger.info("User authenticated", { requestId, userId: user.id })

    // Processar dados do perfil
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      logger.error("Invalid JSON in request body", { requestId, error: parseError })
      return ErrorHandler.handleApiError(
        new Error("Dados inválidos no corpo da requisição"),
        "INVALID_JSON",
        400
      )
    }

    logger.info("Profile data received", { requestId, fieldsCount: Object.keys(body).length })

    // Campos permitidos para atualização
    const allowedFields = [
      'first_name',
      'last_name', 
      'bio',
      'avatar_url',
      'age',
      'city',
      'state',
      'country',
      'timezone',
      'languages',
      'job_title',
      'company',
      'experience_years',
      'mentorship_topics',
      'inclusive_tags',
      'session_price_usd',
      'availability_status',
      'linkedin_url',
      'github_url',
      'twitter_url',
      'website_url',
      'phone',
      'expertise_areas'
    ]

    // Filtrar apenas campos permitidos
    const updateData: any = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Validar dados
    const validation = validateProfileData(updateData)
    if (!validation.isValid) {
      logger.warn("Profile validation failed", { 
        requestId, 
        userId: user.id, 
        errors: validation.errors 
      })
      return NextResponse.json({ 
        error: "Dados inválidos", 
        details: validation.errors 
      }, { status: 400 })
    }

    // Sempre atualizar o timestamp
    updateData.updated_at = new Date().toISOString()

    logger.info("Updating profile", { 
      requestId, 
      userId: user.id, 
      fields: Object.keys(updateData) 
    })

    // Atualizar perfil
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)
      .select()
      .single()

    if (updateError) {
      logger.error("Database update failed", { 
        requestId, 
        userId: user.id, 
        error: updateError,
        updateData: Object.keys(updateData)
      })
      
      // Categorizar tipos de erro do Supabase
      let errorMessage = "Erro ao atualizar perfil"
      let errorCode = "UPDATE_FAILED"
      
      if (updateError.code === "23505") {
        errorMessage = "Dados duplicados encontrados"
        errorCode = "DUPLICATE_DATA"
      } else if (updateError.code === "23503") {
        errorMessage = "Referência inválida nos dados"
        errorCode = "INVALID_REFERENCE"
      } else if (updateError.code === "42501") {
        errorMessage = "Permissão insuficiente para atualizar"
        errorCode = "INSUFFICIENT_PERMISSIONS"
      }
      
      return ErrorHandler.handleApiError(
        updateError,
        errorCode,
        400,
        errorMessage
      )
    }

    const duration = Date.now() - startTime
    logger.info("Profile updated successfully", { 
      requestId, 
      userId: user.id, 
      duration: `${duration}ms` 
    })

    return NextResponse.json({
      message: "Perfil atualizado com sucesso",
      profile: updatedProfile,
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error("Unexpected error in profile update", { 
      requestId, 
      error, 
      duration: `${duration}ms` 
    })
    
    return ErrorHandler.handleApiError(
      error instanceof Error ? error : new Error("Erro desconhecido"),
      "INTERNAL_ERROR",
      500
    )
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(7)
  
  try {
    logger.info("Profile fetch started", { requestId })

    // Verificar autenticação
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      logger.warn("Missing authorization header", { requestId })
      return ErrorHandler.handleApiError(
        new Error("Token de autorização necessário"),
        "AUTH_MISSING",
        401
      )
    }

    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      logger.warn("Authentication failed", { requestId, error: authError })
      return ErrorHandler.handleApiError(
        authError || new Error("Token inválido"),
        "AUTH_INVALID",
        401
      )
    }

    logger.info("User authenticated", { requestId, userId: user.id })

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) {
      logger.error("Profile fetch failed", { 
        requestId, 
        userId: user.id, 
        error: profileError 
      })
      
      if (profileError.code === "PGRST116") {
        return ErrorHandler.handleApiError(
          new Error("Perfil não encontrado"),
          "PROFILE_NOT_FOUND",
          404
        )
      }
      
      return ErrorHandler.handleApiError(
        profileError,
        "PROFILE_FETCH_FAILED",
        500
      )
    }

    // Buscar role do usuário
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select(`
        roles (
          name
        )
      `)
      .eq("user_id", user.id)
      .single()

    if (roleError && roleError.code !== "PGRST116") {
      logger.warn("Role fetch failed", { 
        requestId, 
        userId: user.id, 
        error: roleError 
      })
    }

    const role = userRole?.roles ? (userRole.roles as any).name : null

    const duration = Date.now() - startTime
    logger.info("Profile fetched successfully", { 
      requestId, 
      userId: user.id, 
      hasRole: !!role,
      duration: `${duration}ms` 
    })

    return NextResponse.json({
      profile: {
        ...profile,
        role
      }
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error("Unexpected error in profile fetch", { 
      requestId, 
      error, 
      duration: `${duration}ms` 
    })
    
    return ErrorHandler.handleApiError(
      error instanceof Error ? error : new Error("Erro desconhecido"),
      "INTERNAL_ERROR",
      500
    )
  }
}
