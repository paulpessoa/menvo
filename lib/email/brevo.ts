/**
 * Brevo Email Service
 * Serviço simplificado para envio de emails via Brevo (SMTP)
 */

interface AppointmentRequestData {
  mentorEmail: string
  mentorName: string
  menteeName: string
  scheduledAt: string
  message: string
  token: string
}

interface AppointmentConfirmationData {
  mentorEmail: string
  menteeEmail: string
  mentorName: string
  menteeName: string
  scheduledAt: string
  meetLink: string | null
  calendarLink?: string | null
  menteeNotes?: string // Comentários do mentee
  mentorNotes?: string // Anotações do mentor
}

interface VerificationData {
  userEmail: string
  userName: string
  status: 'approved' | 'rejected'
  notes?: string
}

/**
 * Envia notificação de status de verificação de perfil
 */
export async function sendVerificationNotification(
  data: VerificationData
): Promise<void> {
  const { userEmail, userName, status, notes } = data
  const isApproved = status === 'approved'

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${isApproved ? '#10B981' : '#F59E0B'}; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .info { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid ${isApproved ? '#10B981' : '#F59E0B'}; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${isApproved ? 'Perfil Verificado!' : 'Ajustes Necessários no Perfil'}</h1>
        </div>
        <div class="content">
          <p>Olá, <strong>${userName}</strong>!</p>
          
          <p>A equipe do Menvo analisou seu perfil.</p>
          
          <div class="info">
            <p><strong>Status:</strong> ${isApproved ? 'Aprovado' : 'Aguardando Ajustes'}</p>
            ${notes ? `<p><strong>Observações do Administrador:</strong></p><p>${notes}</p>` : ''}
          </div>
          
          ${isApproved 
            ? `<p>Parabéns! Seu perfil já está publicado e visível para a comunidade.</p>`
            : `<p>Por favor, realize os ajustes solicitados para que possamos validar seu perfil o quanto antes.</p>`
          }
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Acessar meu Dashboard</a>
          </div>
        </div>
        <div class="footer">
          <p>Menvo - Plataforma de Mentoria Voluntária</p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY || ""
      },
      body: JSON.stringify({
        sender: { name: "Menvo", email: "contato@menvo.com.br" },
        to: [{ email: userEmail, name: userName }],
        subject: isApproved ? "🎉 Seu perfil no Menvo foi aprovado!" : "📢 Ajustes necessários no seu perfil Menvo",
        htmlContent
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Erro API Brevo: ${JSON.stringify(errorData)}`)
    }
  } catch (error) {
    console.error("Erro ao enviar email de verificação:", error)
  }
}

/**
 * Envia email de solicitação de agendamento ao mentor
 */
export async function sendAppointmentRequest(
  data: AppointmentRequestData
): Promise<void> {
  const { mentorEmail, mentorName, menteeName, scheduledAt, message, token } =
    data

  // URL de confirmação
  const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/appointments/confirm?token=${token}`

  // Template HTML simples
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .info { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nova Solicitação de Mentoria</h1>
        </div>
        <div class="content">
          <p>Olá, <strong>${mentorName}</strong>!</p>
          
          <p><strong>${menteeName}</strong> solicitou uma sessão de mentoria com você.</p>
          
          <div class="info">
            <p><strong>📅 Data e Hora:</strong> ${new Date(
              scheduledAt
            ).toLocaleString("pt-BR")}</p>
            <p><strong>💬 Mensagem:</strong></p>
            <p>${message}</p>
          </div>
          
          <p>Para confirmar este agendamento, clique no botão abaixo:</p>
          
          <div style="text-align: center;">
            <a href="${confirmUrl}" class="button">Confirmar Agendamento</a>
          </div>
          
          <p style="font-size: 12px; color: #666; margin-top: 20px;">
            Ou copie e cole este link no seu navegador:<br>
            ${confirmUrl}
          </p>
        </div>
        <div class="footer">
          <p>Menvo - Plataforma de Mentoria</p>
          <p>Este é um email automático, por favor não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY || ""
      },
      body: JSON.stringify({
        sender: {
          name: process.env.BREVO_SENDER_NAME || "Menvo",
          email: process.env.BREVO_SENDER_EMAIL || "noreply@menvo.com.br"
        },
        to: [
          {
            email: mentorEmail,
            name: mentorName
          }
        ],
        subject: `Nova solicitação de mentoria de ${menteeName}`,
        htmlContent
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("[EMAIL] Erro ao enviar email de agendamento:", error)
      throw new Error(`Falha ao enviar email: ${response.status}`)
    }

    console.log(
      "[EMAIL] Email de agendamento enviado com sucesso para:",
      mentorEmail
    )
  } catch (error) {
    console.error("[EMAIL] Erro ao enviar email:", error)
    throw error
  }
}

/**
 * Envia email de confirmação de agendamento para mentor e mentee
 */
export async function sendAppointmentConfirmation(
  data: AppointmentConfirmationData
): Promise<void> {
  const {
    mentorEmail,
    menteeEmail,
    mentorName,
    menteeName,
    scheduledAt,
    meetLink,
    menteeNotes,
    mentorNotes
  } = data

  // Formatar data
  const formattedDate = new Date(scheduledAt).toLocaleString("pt-BR", {
    dateStyle: "full",
    timeStyle: "short"
  })

  // Template HTML com link do Meet e Calendar
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .info { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #e5e7eb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; font-weight: bold; }
        .meet-link { background-color: #EEF2FF; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #4F46E5; }
        .calendar-link { background-color: #F0FDF4; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #10B981; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Mentoria Confirmada!</h1>
        </div>
        <div class="content">
          <p>Sua sessão de mentoria foi confirmada com sucesso!</p>
          
          <div class="info">
            <p><strong>👤 Mentor:</strong> ${mentorName}</p>
            <p><strong>👤 Mentee:</strong> ${menteeName}</p>
            <p><strong>📅 Data e Hora:</strong> ${formattedDate}</p>
          </div>
          
          ${
            menteeNotes
              ? `
          <div class="info">
            <p><strong>💬 Comentários do Mentee:</strong></p>
            <p style="white-space: pre-wrap;">${menteeNotes}</p>
          </div>
          `
              : ""
          }
          
          ${
            mentorNotes
              ? `
          <div class="info">
            <p><strong>📝 Observações do Mentor:</strong></p>
            <p style="white-space: pre-wrap;">${mentorNotes}</p>
          </div>
          `
              : ""
          }
          
          ${
            meetLink
              ? `
          <div class="meet-link">
            <p><strong>🎥 Link da Reunião (Google Meet):</strong></p>
            <p style="margin: 10px 0;">
              <a href="${meetLink}" class="button">Entrar no Google Meet</a>
            </p>
            <p style="font-size: 12px; color: #666; word-break: break-all;">
              Ou copie e cole este link: ${meetLink}
            </p>
          </div>
          `
              : ""
          }

          ${
            calendarLink
              ? `
          <div class="calendar-link">
            <p><strong>📅 Adicionar ao Calendário:</strong></p>
            <p>Você pode acessar os detalhes e gerenciar este evento no seu Google Calendar:</p>
            <p style="margin: 10px 0;">
              <a href="${calendarLink}" style="color: #10B981; font-weight: bold; text-decoration: underline;">Ver Evento no Google Calendar</a>
            </p>
          </div>
          `
              : `
          <div class="meet-link">
            <p><strong>📧 Convite do Google Calendar:</strong></p>
            <p>Você também receberá um convite por e-mail do Google Calendar com o link da reunião.</p>
          </div>
          `
          }
          
          <p><strong>💡 Dicas para a sessão:</strong></p>
          <ul>
            <li>Entre alguns minutos antes do horário agendado</li>
            <li>Teste seu microfone e câmera</li>
            <li>Prepare suas dúvidas e objetivos</li>
            <li>Tenha papel e caneta para anotações</li>
          </ul>
          
          <p>Prepare-se para uma ótima sessão de mentoria! 🚀</p>
        </div>
        <div class="footer">
          <p>Menvo - Plataforma de Mentoria Voluntária</p>
          <p>Este é um email automático, por favor não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    // Enviar para ambos (mentor e mentee)
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY || ""
      },
      body: JSON.stringify({
        sender: {
          name: process.env.BREVO_SENDER_NAME || "Menvo",
          email: process.env.BREVO_SENDER_EMAIL || "noreply@menvo.com.br"
        },
        to: [
          {
            email: mentorEmail,
            name: mentorName
          },
          {
            email: menteeEmail,
            name: menteeName
          }
        ],
        subject: "Mentoria confirmada!",
        htmlContent
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("[EMAIL] Erro ao enviar email de confirmação:", error)
      throw new Error(`Falha ao enviar email: ${response.status}`)
    }

    console.log("[EMAIL] Email de confirmação enviado com sucesso")
  } catch (error) {
    console.error("[EMAIL] Erro ao enviar email:", error)
    throw error
  }
}

interface OrganizationInvitationData {
  recipientEmail: string
  recipientName: string
  organizationName: string
  organizationLogo?: string
  inviterName: string
  role: string
  invitationToken: string
}

/**
 * Envia email de convite para organização
 */
export async function sendOrganizationInvitation(
  data: OrganizationInvitationData
): Promise<void> {
  const {
    recipientEmail,
    recipientName,
    organizationName,
    organizationLogo,
    inviterName,
    role,
    invitationToken
  } = data

  // URL de aceitação do convite
  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/organizations/invitations/accept?token=${invitationToken}`

  // Template HTML with organization branding
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .info { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeaderWithBranding(
          "Convite para Organização",
          organizationName,
          organizationLogo
        )}
        <div class="content">
          <p>Olá, <strong>${recipientName}</strong>!</p>
          
          <p><strong>${inviterName}</strong> convidou você para fazer parte da organização <strong>${organizationName}</strong>.</p>
          
          <div class="info">
            <p><strong>🏢 Organização:</strong> ${organizationName}</p>
            <p><strong>👤 Função:</strong> ${
              role === "mentor" ? "Mentor" : "Mentee"
            }</p>
            <p><strong>✉️ Convidado por:</strong> ${inviterName}</p>
          </div>
          
          <p>Para aceitar este convite, clique no botão abaixo:</p>
          
          <div style="text-align: center;">
            <a href="${acceptUrl}" class="button">Aceitar Convite</a>
          </div>
          
          <p style="font-size: 12px; color: #666; margin-top: 20px;">
            Ou copie e cole este link no seu navegador:<br>
            ${acceptUrl}
          </p>
          
          <p style="font-size: 12px; color: #999; margin-top: 20px;">
            Este convite expira em 30 dias.
          </p>
        </div>
        <div class="footer">
          <p>Menvo - Plataforma de Mentoria</p>
          <p>Este é um email automático, por favor não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY || ""
      },
      body: JSON.stringify({
        sender: {
          name: process.env.BREVO_SENDER_NAME || "Menvo",
          email: process.env.BREVO_SENDER_EMAIL || "noreply@menvo.com.br"
        },
        to: [
          {
            email: recipientEmail,
            name: recipientName
          }
        ],
        subject: getEmailSubject(
          `Convite para ${organizationName}`,
          organizationName
        ),
        htmlContent
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("[EMAIL] Erro ao enviar convite de organização:", error)
      throw new Error(`Falha ao enviar email: ${response.status}`)
    }

    console.log(
      "[EMAIL] Convite de organização enviado com sucesso para:",
      recipientEmail
    )
  } catch (error) {
    console.error("[EMAIL] Erro ao enviar email:", error)
    throw error
  }
}

interface OrganizationApprovedData {
  adminEmail: string
  adminName: string
  organizationName: string
  organizationId: string
  organizationLogo?: string
}

/**
 * Envia email de aprovação de organização para o admin
 */
export async function sendOrganizationApprovedEmail(
  data: OrganizationApprovedData
): Promise<void> {
  const {
    adminEmail,
    adminName,
    organizationName,
    organizationId,
    organizationLogo
  } = data

  // URL do dashboard da organização
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/organizations/${organizationId}`

  // Template HTML with organization branding
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .info { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .steps { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .steps li { margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        ${
          organizationLogo
            ? `<div style="text-align: center; padding: 20px;"><img src="${organizationLogo}" alt="${organizationName}" style="max-width: 150px; max-height: 150px;" /></div>`
            : ""
        }
        <div class="header">
          <h1>✅ Organização Aprovada!</h1>
        </div>
        <div class="content">
          <p>Olá, <strong>${adminName}</strong>!</p>
          
          <p>Temos ótimas notícias! Sua organização <strong>${organizationName}</strong> foi aprovada e está pronta para uso.</p>
          
          <div class="info">
            <p><strong>🎉 Próximos Passos:</strong></p>
          </div>
          
          <div class="steps">
            <ol>
              <li><strong>Convide membros:</strong> Adicione mentores e mentees à sua organização</li>
              <li><strong>Configure preferências:</strong> Ajuste as configurações de visibilidade e permissões</li>
              <li><strong>Explore o dashboard:</strong> Acompanhe métricas e atividades da organização</li>
            </ol>
          </div>
          
          <p>Acesse o painel de controle da sua organização:</p>
          
          <div style="text-align: center;">
            <a href="${dashboardUrl}" class="button">Acessar Dashboard</a>
          </div>
          
          <p style="font-size: 12px; color: #666; margin-top: 20px;">
            Ou copie e cole este link no seu navegador:<br>
            ${dashboardUrl}
          </p>
        </div>
        <div class="footer">
          <p>Menvo - Plataforma de Mentoria</p>
          <p>Este é um email automático, por favor não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY || ""
      },
      body: JSON.stringify({
        sender: {
          name: process.env.BREVO_SENDER_NAME || "Menvo",
          email: process.env.BREVO_SENDER_EMAIL || "noreply@menvo.com.br"
        },
        to: [
          {
            email: adminEmail,
            name: adminName
          }
        ],
        subject: getEmailSubject("Organização aprovada!", organizationName),
        htmlContent
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("[EMAIL] Erro ao enviar email de aprovação:", error)
      throw new Error(`Falha ao enviar email: ${response.status}`)
    }

    console.log(
      "[EMAIL] Email de aprovação enviado com sucesso para:",
      adminEmail
    )
  } catch (error) {
    console.error("[EMAIL] Erro ao enviar email:", error)
    throw error
  }
}

interface MemberJoinedData {
  adminEmail: string
  adminName: string
  organizationName: string
  memberName: string
  memberRole: string
}

/**
 * Envia email para admins quando um novo membro entra na organização
 */
export async function sendMemberJoinedEmail(
  data: MemberJoinedData
): Promise<void> {
  const { adminEmail, adminName, organizationName, memberName, memberRole } =
    data

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .info { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>👋 Novo Membro</h1>
        </div>
        <div class="content">
          <p>Olá, <strong>${adminName}</strong>!</p>
          
          <p><strong>${memberName}</strong> aceitou o convite e agora faz parte de <strong>${organizationName}</strong>.</p>
          
          <div class="info">
            <p><strong>👤 Membro:</strong> ${memberName}</p>
            <p><strong>🎯 Função:</strong> ${
              memberRole === "mentor" ? "Mentor" : "Mentee"
            }</p>
          </div>
        </div>
        <div class="footer">
          <p>Menvo - Plataforma de Mentoria</p>
          <p>Este é um email automático, por favor não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY || ""
      },
      body: JSON.stringify({
        sender: {
          name: process.env.BREVO_SENDER_NAME || "Menvo",
          email: process.env.BREVO_SENDER_EMAIL || "noreply@menvo.com.br"
        },
        to: [
          {
            email: adminEmail,
            name: adminName
          }
        ],
        subject: `Novo membro em ${organizationName}`,
        htmlContent
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("[EMAIL] Erro ao enviar email de novo membro:", error)
      throw new Error(`Falha ao enviar email: ${response.status}`)
    }

    console.log("[EMAIL] Email de novo membro enviado com sucesso")
  } catch (error) {
    console.error("[EMAIL] Erro ao enviar email:", error)
    throw error
  }
}

interface MemberLeftData {
  adminEmail: string
  adminName: string
  organizationName: string
  memberName: string
  memberRole: string
}

/**
 * Envia email para admins quando um membro sai da organização
 */
export async function sendMemberLeftEmail(data: MemberLeftData): Promise<void> {
  const { adminEmail, adminName, organizationName, memberName, memberRole } =
    data

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #EF4444; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .info { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>👋 Membro Saiu</h1>
        </div>
        <div class="content">
          <p>Olá, <strong>${adminName}</strong>!</p>
          
          <p><strong>${memberName}</strong> saiu de <strong>${organizationName}</strong>.</p>
          
          <div class="info">
            <p><strong>👤 Membro:</strong> ${memberName}</p>
            <p><strong>🎯 Função:</strong> ${
              memberRole === "mentor" ? "Mentor" : "Mentee"
            }</p>
          </div>
        </div>
        <div class="footer">
          <p>Menvo - Plataforma de Mentoria</p>
          <p>Este é um email automático, por favor não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY || ""
      },
      body: JSON.stringify({
        sender: {
          name: process.env.BREVO_SENDER_NAME || "Menvo",
          email: process.env.BREVO_SENDER_EMAIL || "noreply@menvo.com.br"
        },
        to: [
          {
            email: adminEmail,
            name: adminName
          }
        ],
        subject: `Membro saiu de ${organizationName}`,
        htmlContent
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("[EMAIL] Erro ao enviar email de saída de membro:", error)
      throw new Error(`Falha ao enviar email: ${response.status}`)
    }

    console.log("[EMAIL] Email de saída de membro enviado com sucesso")
  } catch (error) {
    console.error("[EMAIL] Erro ao enviar email:", error)
    throw error
  }
}

interface MembershipExpiredData {
  userEmail: string
  userName: string
  organizationName: string
}

/**
 * Envia email para usuário quando sua membership expira
 */
export async function sendMembershipExpiredEmail(
  data: MembershipExpiredData
): Promise<void> {
  const { userEmail, userName, organizationName } = data

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #F59E0B; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .info { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Membership Expirada</h1>
        </div>
        <div class="content">
          <p>Olá, <strong>${userName}</strong>!</p>
          
          <p>Sua membership em <strong>${organizationName}</strong> expirou.</p>
          
          <div class="info">
            <p>Se você deseja continuar fazendo parte desta organização, entre em contato com os administradores.</p>
          </div>
        </div>
        <div class="footer">
          <p>Menvo - Plataforma de Mentoria</p>
          <p>Este é um email automático, por favor não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY || ""
      },
      body: JSON.stringify({
        sender: {
          name: process.env.BREVO_SENDER_NAME || "Menvo",
          email: process.env.BREVO_SENDER_EMAIL || "noreply@menvo.com.br"
        },
        to: [
          {
            email: userEmail,
            name: userName
          }
        ],
        subject: `Sua membership em ${organizationName} expirou`,
        htmlContent
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("[EMAIL] Erro ao enviar email de expiração:", error)
      throw new Error(`Falha ao enviar email: ${response.status}`)
    }

    console.log("[EMAIL] Email de expiração enviado com sucesso")
  } catch (error) {
    console.error("[EMAIL] Erro ao enviar email:", error)
    throw error
  }
}

/**
 * Helper function to add organization branding to email templates
 */
function getEmailHeaderWithBranding(
  title: string,
  organizationName?: string,
  organizationLogo?: string
): string {
  const backgroundColor = organizationName ? "#4F46E5" : "#4F46E5"

  let logoHtml = ""
  if (organizationLogo) {
    logoHtml = `<img src="${organizationLogo}" alt="${organizationName}" style="max-width: 100px; max-height: 100px; margin-bottom: 10px;" />`
  }

  let orgNameHtml = ""
  if (organizationName) {
    orgNameHtml = `<p style="margin: 5px 0; font-size: 14px; opacity: 0.9;">${organizationName}</p>`
  }

  return `
    <div class="header" style="background-color: ${backgroundColor}; color: white; padding: 20px; text-align: center;">
      ${logoHtml}
      <h1 style="margin: 10px 0;">${title}</h1>
      ${orgNameHtml}
    </div>
  `
}

/**
 * Get email subject with organization name prefix
 */
function getEmailSubject(
  baseSubject: string,
  organizationName?: string
): string {
  if (organizationName) {
    return `[${organizationName}] ${baseSubject}`
  }
  return baseSubject
}
