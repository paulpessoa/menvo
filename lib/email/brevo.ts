/**
 * Brevo Email Service
 * Serviço para envio de emails via Brevo (SMTP) com visual padronizado MENVO/Supabase
 */

// Cores padrão
const COLORS = {
  primary: '#0F7185',
  secondary: '#4191A2',
  text: '#333333',
  muted: '#9A979E',
  bg: '#f4f4f4',
  white: '#ffffff',
  divider: '#C6C2CC'
};

// Layout Base (CSS e Container)
const getEmailLayout = (title: string, content: string, footerExtra?: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: ${COLORS.text}; background-color: ${COLORS.bg}; padding: 20px; }
        .email-container { max-width: 550px; margin: 0 auto; background-color: ${COLORS.white}; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background: ${COLORS.primary}; color: white; padding: 35px; text-align: center; }
        .header h1 { font-size: 22px; font-weight: 600; margin: 0; letter-spacing: 0.5px; }
        .content { padding: 40px 35px; background-color: ${COLORS.white}; }
        .content h2 { color: ${COLORS.secondary}; font-size: 18px; font-weight: 600; margin-bottom: 20px; line-height: 1.3; }
        .content p { color: ${COLORS.muted}; font-size: 14px; margin-bottom: 15px; line-height: 1.5; }
        .info-box { background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 25px 0; }
        .info-item { margin-bottom: 10px; font-size: 14px; }
        .info-item strong { color: ${COLORS.text}; }
        .button-container { text-align: center; margin: 30px 0; }
        .button { display: inline-block; background: ${COLORS.primary}; color: white !important; text-decoration: none; padding: 15px 35px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 10px rgba(15, 113, 133, 0.2); }
        .divider { height: 1px; background-color: ${COLORS.divider}; margin: 30px 0; opacity: 0.5; }
        .signature { margin-top: 30px; border-top: 1px solid ${COLORS.bg}; padding-top: 20px; }
        .signature p { margin: 2px 0; font-size: 13px; }
        .footer { background-color: #F8F9FB; padding: 25px 35px; text-align: center; border-top: 1px solid #e9ecef; }
        .footer p { color: ${COLORS.muted}; font-size: 12px; margin: 3px 0; }
        @media only screen and (max-width: 480px) { .email-container { width: 100% !important; } .header { padding: 25px; } .content { padding: 25px; } }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header"><h1>${title}</h1></div>
        <div class="content">
            ${content}
            <div class="signature">
                <p><strong>Paul Pessoa</strong></p>
                <p>Equipe MENVO - Mentoria Voluntária</p>
            </div>
        </div>
        <div class="footer">
            <p>Este e-mail foi enviado automaticamente. Por favor, não responda.</p>
            <p>© 2025 MENVO. Todos os direitos reservados.</p>
            ${footerExtra || ''}
        </div>
    </div>
</body>
</html>
`;

// Interfaces e Tipos
interface AppointmentRequestData {
  mentorEmail: string; mentorName: string; menteeName: string; scheduledAt: string; message: string; token: string;
}

interface AppointmentConfirmationData {
  mentorEmail: string; menteeEmail: string; mentorName: string; menteeName: string; scheduledAt: string; 
  meetLink: string | null; calendarLink?: string | null; menteeNotes?: string; mentorNotes?: string;
}

interface VerificationData {
  userEmail: string; userName: string; status: 'approved' | 'rejected'; notes?: string;
}

/**
 * Envia lembrete de mentoria no dia da sessão
 */
export async function sendAppointmentReminder(data: {
    userEmail: string; userName: string; otherPersonName: string; scheduledAt: string; meetLink: string | null;
}): Promise<void> {
    const formattedTime = new Date(data.scheduledAt).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
    const content = `
        <h2>Lembrete: Sua mentoria é hoje! 📅</h2>
        <p>Olá, ${data.userName}. Passando para lembrar que sua sessão de mentoria com <strong>${data.otherPersonName}</strong> está agendada para hoje às <strong>${formattedTime}</strong>.</p>
        <div class="info-box">
            <p><strong>Evento:</strong> Mentoria MENVO</p>
            <p><strong>Horário:</strong> ${formattedTime} (Horário de Brasília)</p>
        </div>
        ${data.meetLink ? `
        <div class="button-container">
            <a href="${data.meetLink}" class="button">Entrar no Google Meet</a>
        </div>` : ''}
        <p>Prepare suas perguntas e aproveite a sessão! 🚀</p>
    `;
    await sendEmail(data.userEmail, "🔔 Lembrete: Sua mentoria é hoje!", getEmailLayout("Lembrete de Mentoria", content));
}

/**
 * Envia solicitação de feedback após a mentoria
 */
export async function sendFeedbackRequest(data: {
    userEmail: string; userName: string; mentorName: string; appointmentId: string | number;
}): Promise<void> {
    const feedbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/mentee?feedback=${data.appointmentId}`;
    const content = `
        <h2>Como foi sua mentoria? ⭐</h2>
        <p>Olá, ${data.userName}! Notamos que sua sessão com <strong>${data.mentorName}</strong> terminou há pouco tempo.</p>
        <p>Sua avaliação é fundamental para ajudarmos o mentor a evoluir e para darmos credibilidade ao trabalho voluntário dele na plataforma.</p>
        <div class="button-container">
            <a href="${feedbackUrl}" class="button">Avaliar Mentoria Agora</a>
        </div>
        <p>Leva menos de 1 minuto e faz toda a diferença para a nossa comunidade!</p>
    `;
    await sendEmail(data.userEmail, "⭐ Como foi sua mentoria? Deixe sua avaliação!", getEmailLayout("Avaliação de Mentoria", content));
}

/**
 * Envia notificação de status de verificação de perfil
 */
export async function sendVerificationNotification(data: VerificationData): Promise<void> {
  const { userEmail, userName, status, notes } = data
  const isApproved = status === 'approved'
  
  const content = `
    <h2>Olá, ${userName}!</h2>
    <p>A equipe do Menvo analisou o seu perfil de mentor.</p>
    <div class="info-box" style="border-left: 4px solid ${isApproved ? '#10B981' : '#F59E0B'}">
        <p style="margin-bottom: 5px;"><strong>Status:</strong> ${isApproved ? 'Aprovado ✅' : 'Ajustes Necessários 📢'}</p>
        ${notes ? `<p><strong>Observações:</strong> ${notes}</p>` : ''}
    </div>
    <div class="button-container">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Acessar meu Dashboard</a>
    </div>
  `;
  await sendEmail(userEmail, isApproved ? "🎉 Seu perfil no Menvo foi aprovado!" : "📢 Ajustes necessários no seu perfil Menvo", getEmailLayout(isApproved ? "Perfil Verificado" : "Ajustes no Perfil", content));
}

/**
 * Envia email de solicitação de agendamento ao mentor
 */
export async function sendAppointmentRequest(data: AppointmentRequestData): Promise<void> {
  const { mentorEmail, mentorName, menteeName, scheduledAt, message, token } = data
  const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/appointments/confirm?token=${token}`

  const content = `
    <h2>Olá, ${mentorName}!</h2>
    <p>Você recebeu uma nova solicitação de mentoria na plataforma.</p>
    <div class="info-box">
        <div class="info-item"><strong>Solicitante:</strong> ${menteeName}</div>
        <div class="info-item"><strong>Data e Hora:</strong> ${new Date(scheduledAt).toLocaleString("pt-BR")}</div>
        <div class="info-item"><strong>Mensagem:</strong><br/>${message}</div>
    </div>
    <div class="button-container">
        <a href="${confirmUrl}" class="button">Confirmar Agendamento</a>
    </div>
  `;
  await sendEmail(mentorEmail, `Nova solicitação de mentoria de ${menteeName}`, getEmailLayout("Nova Solicitação", content));
}

/**
 * Envia email de confirmação de agendamento para mentor e mentee
 */
export async function sendAppointmentConfirmation(data: AppointmentConfirmationData): Promise<void> {
  const { mentorEmail, menteeEmail, mentorName, menteeName, scheduledAt, meetLink, calendarLink } = data
  const formattedDate = new Date(scheduledAt).toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "short" });

  const content = `
    <h2>Sua mentoria está confirmada! ✅</h2>
    <p>Tudo certo! A sessão de mentoria foi agendada e os detalhes estão abaixo:</p>
    <div class="info-box">
        <div class="info-item"><strong>Mentor:</strong> ${mentorName}</div>
        <div class="info-item"><strong>Mentee:</strong> ${menteeName}</div>
        <div class="info-item"><strong>Data:</strong> ${formattedDate}</div>
    </div>
    ${meetLink ? `<div class="button-container"><a href="${meetLink}" class="button" style="background: #4F46E5;">Entrar no Google Meet</a></div>` : ''}
    ${calendarLink ? `<p style="text-align: center;"><a href="${calendarLink}" style="color: ${COLORS.secondary}; font-weight: 600; font-size: 14px; text-decoration: underline;">Ver no Google Calendar</a></p>` : ''}
    <div class="divider"></div>
    <p><strong>Dica:</strong> Entre alguns minutos antes e prepare suas dúvidas. Ótima mentoria! 🚀</p>
  `;
  await sendEmail([mentorEmail, menteeEmail], "Sessão de Mentoria Confirmada! ✅", getEmailLayout("Mentoria Confirmada", content));
}

/**
 * Helper para envio via Brevo API
 */
async function sendEmail(to: string | string[], subject: string, htmlContent: string) {
  const recipients = Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }];
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", "api-key": process.env.BREVO_API_KEY || "" },
      body: JSON.stringify({
        sender: { name: process.env.BREVO_SENDER_NAME || "Menvo", email: process.env.BREVO_SENDER_EMAIL || "contato@menvo.com.br" },
        to: recipients, subject, htmlContent
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error("[EMAIL] Erro Brevo:", errorData);
    }
  } catch (error) {
    console.error("[EMAIL] Falha crítica:", error);
  }
}

