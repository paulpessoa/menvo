import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Validates required environment variables for email configuration
 */
function validateEmailConfig() {
  const required = ['BREVO_SMTP_USER', 'BREVO_SMTP_PASSWORD']
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.warn(`Missing email configuration: ${missing.join(', ')}`)
    return false
  }
  return true
}

/**
 * Creates email transporter with error handling
 */
function createEmailTransporter() {
  try {
    if (!validateEmailConfig()) {
      console.warn('Email transporter not configured - emails will not be sent')
      return null
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_USER!,
        pass: process.env.BREVO_SMTP_PASSWORD!
      }
    })

    console.log('Email transporter configured successfully')
    return transporter
  } catch (error) {
    console.error('Failed to create email transporter:', error)
    return null
  }
}

// Configuração do Brevo SMTP
const transporter = createEmailTransporter()

interface MigrationNotificationData {
  email: string
  firstName?: string
  lastName?: string
  temporaryPassword: string
  loginUrl: string
}

/**
 * Envia notificação por email para usuário migrado
 * @param data - Dados da notificação incluindo email, nome e credenciais
 * @returns Promise com resultado do envio
 */
export async function sendMigrationNotification(data: MigrationNotificationData) {
  try {
    // Verificar se o transporter está configurado
    if (!transporter) {
      console.error('Email transporter not configured - cannot send notification')
      return { success: false, error: 'Email service not configured' }
    }

    const { email, firstName, lastName, temporaryPassword, loginUrl } = data
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Usuário'

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Bem-vindo à Nova Plataforma!</h2>
        
        <p>Olá ${fullName},</p>
        
        <p>Sua conta foi migrada com sucesso para nossa nova plataforma de mentoria. 
        Agora você pode acessar todas as funcionalidades melhoradas!</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Dados de Acesso:</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Senha Temporária:</strong> <code style="background-color: #e0e0e0; padding: 2px 4px; border-radius: 4px;">${temporaryPassword}</code></p>
        </div>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>⚠️ Importante:</strong> Por segurança, altere sua senha no primeiro acesso.</p>
        </div>
        
        <p>
          <a href="${loginUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Acessar Plataforma
          </a>
        </p>
        
        <h3>O que mudou?</h3>
        <ul>
          <li>Interface mais moderna e intuitiva</li>
          <li>Sistema de agendamento melhorado</li>
          <li>Novas funcionalidades de comunicação</li>
          <li>Melhor organização do perfil</li>
        </ul>
        
        <p>Se você tiver alguma dúvida ou problema para acessar, entre em contato conosco.</p>
        
        <p>Bem-vindo de volta!<br>
        Equipe da Plataforma</p>
      </div>
    `

    const emailResult = await transporter.sendMail({
      from: process.env.BREVO_FROM_EMAIL || 'noreply@suaplataforma.com',
      to: email,
      subject: 'Sua conta foi migrada - Nova Plataforma de Mentoria',
      html: emailContent
    })

    console.log('Email de migração enviado:', emailResult.messageId)
    return { success: true, messageId: emailResult.messageId }

  } catch (error) {
    console.error('Erro inesperado ao enviar notificação:', error)
    return { success: false, error: 'Erro inesperado' }
  }
}

/**
 * Envia notificações em lote para usuários migrados
 */
export async function sendBatchMigrationNotifications(batchSize: number = 10) {
  try {
    // Buscar usuários migrados que ainda não foram notificados
    const { data: migrations, error } = await supabase
      .from('user_migrations')
      .select(`
        id,
        email,
        old_user_data,
        new_user_id,
        migrated_at
      `)
      .eq('migration_status', 'completed')
      .is('notification_sent_at', null)
      .limit(batchSize)

    if (error) {
      throw error
    }

    if (!migrations || migrations.length === 0) {
      console.log('Nenhuma migração pendente de notificação')
      return { success: true, sent: 0 }
    }

    let successCount = 0
    let errorCount = 0

    for (const migration of migrations) {
      try {
        // Gerar senha temporária (você pode armazenar isso de forma mais segura)
        const temporaryPassword = generateTemporaryPassword()
        
        // Atualizar senha do usuário no Supabase Auth
        if (migration.new_user_id) {
          await supabase.auth.admin.updateUserById(migration.new_user_id, {
            password: temporaryPassword
          })
        }

        const notificationResult = await sendMigrationNotification({
          email: migration.email,
          firstName: migration.old_user_data?.first_name,
          lastName: migration.old_user_data?.last_name,
          temporaryPassword,
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`
        })

        if (notificationResult.success) {
          // Marcar como notificado
          await supabase
            .from('user_migrations')
            .update({ 
              notification_sent_at: new Date().toISOString(),
              temporary_password_hash: await hashPassword(temporaryPassword) // Para auditoria
            })
            .eq('id', migration.id)

          successCount++
        } else {
          errorCount++
          console.error(`Falha ao notificar ${migration.email}:`, notificationResult.error)
        }

      } catch (error) {
        errorCount++
        console.error(`Erro ao processar migração ${migration.id}:`, error)
      }

      // Pausa entre envios para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`Notificações enviadas: ${successCount} sucessos, ${errorCount} erros`)
    return { success: true, sent: successCount, errors: errorCount }

  } catch (error) {
    console.error('Erro no envio em lote:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

/**
 * Gera senha temporária segura
 */
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let password = ''
  
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return password
}

/**
 * Hash da senha para auditoria (não usar para autenticação real)
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Agenda envio de notificações (para usar com cron job)
 */
export async function scheduleNotifications() {
  console.log('Iniciando envio programado de notificações de migração...')
  
  const result = await sendBatchMigrationNotifications(20)
  
  if (result.success) {
    console.log(`✅ Notificações enviadas: ${result.sent}`)
    if (result.errors && result.errors > 0) {
      console.log(`⚠️ Erros: ${result.errors}`)
    }
  } else {
    console.error('❌ Falha no envio de notificações:', result.error)
  }
  
  return result
}