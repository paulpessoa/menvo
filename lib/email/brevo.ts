/**
 * Brevo Email Service
 * Serviço para envio de emails transacionais via Brevo (SMTP) com design system oficial MENVO
 */

// Cores padrão oficiais MENVO
const COLORS = {
  primary: '#007585', // Deep Teal oficial Menvo
  secondary: '#006276', // Darker Teal
  text: '#1f2937',
  muted: '#4b5563',
  bg: '#f8fafc',
  white: '#ffffff',
  divider: '#e2e8f0'
};

export type EmailSignatureType = 'personal' | 'team' | 'none';

export interface EmailLayoutOptions {
  signatureType?: EmailSignatureType;
  footerExtra?: string;
}

/**
 * Assinatura pessoal do Paul Pessoa (idealizador/fundador) para e-mails de relacionamento
 */
const getPersonalSignatureHtml = () => `
  <div class="signature" style="margin-top: 35px; border-top: 1px solid ${COLORS.divider}; padding-top: 24px;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%;">
      <tr>
        <td style="width: 68px; vertical-align: top; padding-right: 16px;">
          <img
            src="https://raw.githubusercontent.com/paulpessoa/menvo/main/public/images/paul-pessoa.jpg"
            alt="Paul Pessoa"
            width="64"
            height="64"
            style="border-radius: 50%; display: block; object-fit: cover; width: 64px; height: 64px; border: 2px solid ${COLORS.primary};"
          />
        </td>
        <td style="vertical-align: middle;">
          <p style="font-weight: 700; color: #111827; font-size: 15px; margin: 0 0 2px 0;">Paul Pessoa</p>
          <p style="font-size: 12px; color: ${COLORS.primary}; font-weight: 600; margin: 0 0 10px 0;">Idealizador & Software Engineer · Menvo</p>
          
          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right: 14px; vertical-align: middle;">
                <a href="https://wa.me/5581995097377" target="_blank" style="color: #374151; font-size: 12px; text-decoration: none; font-weight: 500; display: inline-flex; align-items: center;">
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/733/733585.png"
                    width="15"
                    height="15"
                    alt="WhatsApp"
                    style="vertical-align: middle; margin-right: 6px; display: inline-block;"
                  />
                  +55 (81) 9 9509.7377
                </a>
              </td>
              <td style="vertical-align: middle;">
                <a href="https://linkedin.com/in/paulpessoa" target="_blank" style="color: #6b7280; font-size: 12px; text-decoration: none; margin-right: 8px;">LinkedIn</a>
                <span style="color: #d1d5db; font-size: 12px;">·</span>
                <a href="https://github.com/paulpessoa" target="_blank" style="color: #6b7280; font-size: 12px; text-decoration: none; margin-left: 8px;">GitHub</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
`;

// Layout Base (CSS e Container)
const getEmailLayout = (
  title: string,
  content: string,
  options: EmailLayoutOptions | string = {}
) => {
  const opts: EmailLayoutOptions = typeof options === 'string' ? { footerExtra: options } : options;
  const signatureHtml = opts.signatureType === 'personal' ? getPersonalSignatureHtml() : '';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: ${COLORS.text}; background-color: ${COLORS.bg}; padding: 20px; }
        .email-container { max-width: 550px; margin: 0 auto; background-color: ${COLORS.white}; border-radius: 14px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); overflow: hidden; border: 1px solid ${COLORS.divider}; }
        .header { background: ${COLORS.primary}; color: white; padding: 32px 35px; text-align: center; }
        .header h1 { font-size: 22px; font-weight: 700; margin: 0; letter-spacing: 0.3px; color: white; }
        .content { padding: 36px 35px; background-color: ${COLORS.white}; }
        .content h2 { color: ${COLORS.primary}; font-size: 19px; font-weight: 700; margin-bottom: 18px; line-height: 1.3; }
        .content p { color: ${COLORS.text}; font-size: 14px; margin-bottom: 15px; line-height: 1.6; }
        .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; margin: 24px 0; }
        .info-item { margin-bottom: 8px; font-size: 14px; }
        .info-item:last-child { margin-bottom: 0; }
        .info-item strong { color: ${COLORS.text}; }
        .button-container { text-align: center; margin: 28px 0; }
        .button { display: inline-block; background-color: ${COLORS.primary} !important; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 600; box-shadow: 0 2px 8px rgba(0, 117, 133, 0.25); text-align: center; }
        .button:hover { background-color: ${COLORS.secondary} !important; }
        .divider { height: 1px; background-color: ${COLORS.divider}; margin: 28px 0; }
        .footer { background-color: #f8fafc; padding: 24px 35px; text-align: center; border-top: 1px solid ${COLORS.divider}; }
        .footer p { color: #9ca3af; font-size: 12px; margin: 4px 0; }
        @media only screen and (max-width: 480px) { .email-container { width: 100% !important; } .header { padding: 24px; } .content { padding: 24px; } }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header"><h1>${title}</h1></div>
        <div class="content">
            ${content}
            ${signatureHtml}
        </div>
        <div class="footer">
            <p>Este e-mail foi enviado automaticamente pela MENVO.</p>
            <p>© 2026 MENVO. Todos os direitos reservados.</p>
            ${opts.footerExtra || ''}
        </div>
    </div>
</body>
</html>
`;
};

// Interfaces e Tipos
interface AppointmentRequestData {
  mentorEmail: string;
  mentorName: string;
  menteeName: string;
  scheduledAt: string;
  message: string;
  token: string;
}

interface AppointmentConfirmationData {
  mentorEmail: string;
  menteeEmail: string;
  mentorName: string;
  menteeName: string;
  scheduledAt: string;
  meetLink: string | null;
  calendarLink?: string | null;
  menteeNotes?: string;
  mentorNotes?: string;
}

export interface AppointmentCancellationData {
  recipientEmail: string;
  recipientName: string;
  otherPersonName: string;
  scheduledAt: string;
  reason: string;
  cancelledByName: string;
}

interface VerificationData {
  userEmail: string;
  userName: string;
  status: 'approved' | 'rejected';
  notes?: string;
}

/**
 * Helper para formatar data/hora no fuso de Brasília para os e-mails
 */
function formatDateTimeBR(dateStr: string) {
  return new Date(dateStr).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/**
 * Envia lembrete de mentoria no dia da sessão
 */
export async function sendAppointmentReminder(data: {
  userEmail: string;
  userName: string;
  otherPersonName: string;
  scheduledAt: string;
  meetLink: string | null;
}): Promise<void> {
  const formattedTime = new Date(data.scheduledAt).toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: '2-digit',
    minute: '2-digit'
  });
  const content = `
    <h2>Lembrete: Sua mentoria é hoje</h2>
    <p>Olá, ${data.userName}. Passando para lembrar que sua sessão de mentoria com <strong>${data.otherPersonName}</strong> está agendada para hoje às <strong>${formattedTime}</strong>.</p>
    <div class="info-box">
        <p><strong>Evento:</strong> Mentoria MENVO</p>
        <p><strong>Horário:</strong> ${formattedTime} (Horário de Brasília)</p>
    </div>
    ${data.meetLink ? `
    <div class="button-container">
        <a href="${data.meetLink}" class="button">Entrar no Google Meet</a>
    </div>` : ''}
    <p>Prepare suas dúvidas e aproveite ao máximo a troca de experiências.</p>
  `;
  await sendEmail(
    data.userEmail,
    "Lembrete: Sua mentoria é hoje",
    getEmailLayout("Lembrete de Mentoria", content, { signatureType: "team" })
  );
}

/**
 * Envia solicitação de feedback após a mentoria (assinado pessoalmente pelo Paul Pessoa)
 */
export async function sendFeedbackRequest(data: {
  userEmail: string;
  userName: string;
  mentorName: string;
  appointmentId: string | number;
}): Promise<void> {
  const feedbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.menvo.com.br'}/dashboard/mentee?feedback=${data.appointmentId}`;
  const content = `
    <h2>Como foi sua mentoria?</h2>
    <p>Olá, ${data.userName}! Sua sessão com <strong>${data.mentorName}</strong> terminou há pouco tempo.</p>
    <p>Sua avaliação é essencial para fortalecer a comunidade e reconhecer a dedicação voluntária do mentor na plataforma.</p>
    <div class="button-container">
        <a href="${feedbackUrl}" class="button">Avaliar Mentoria Agora</a>
    </div>
    <p>Leva menos de 1 minuto e faz toda a diferença para quem doa seu tempo para ensinar.</p>
  `;
  await sendEmail(
    data.userEmail,
    "Como foi sua mentoria? Deixe sua avaliação",
    getEmailLayout("Avaliação de Mentoria", content, { signatureType: "personal" })
  );
}

/**
 * Envia notificação de status de verificação de perfil de mentor (assinado pessoalmente pelo Paul Pessoa)
 */
export async function sendVerificationNotification(data: VerificationData): Promise<void> {
  const { userEmail, userName, status, notes } = data;
  const isApproved = status === 'approved';

  const content = `
    <h2>Olá, ${userName}!</h2>
    <p>Analisamos com atenção o seu perfil de mentor na Menvo.</p>
    <div class="info-box" style="border-left: 4px solid ${isApproved ? '#007585' : '#F59E0B'}">
        <p style="margin-bottom: 5px;"><strong>Status:</strong> ${isApproved ? 'Aprovado' : 'Ajustes Necessários'}</p>
        ${notes ? `<p><strong>Observações:</strong> ${notes}</p>` : ''}
    </div>
    <div class="button-container">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.menvo.com.br'}/dashboard" class="button">Acessar meu Dashboard</a>
    </div>
    ${isApproved ? '<p>Seja muito bem-vindo(a) à nossa rede de mentores voluntários. Sua experiência fará a diferença na carreira de muitos talentos!</p>' : ''}
  `;
  await sendEmail(
    userEmail,
    isApproved ? "Seu perfil no Menvo foi aprovado" : "Ajustes necessários no seu perfil Menvo",
    getEmailLayout(isApproved ? "Perfil Aprovado" : "Ajustes no Perfil", content, { signatureType: "personal" })
  );
}

/**
 * Envia email de solicitação de agendamento ao mentor
 */
export async function sendAppointmentRequest(data: AppointmentRequestData): Promise<void> {
  const { mentorEmail, mentorName, menteeName, scheduledAt, message, token } = data;
  const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.menvo.com.br'}/appointments/confirm?token=${token}`;

  const content = `
    <h2>Olá, ${mentorName}!</h2>
    <p>Você recebeu uma nova solicitação de mentoria na plataforma Menvo.</p>
    <div class="info-box">
        <div class="info-item"><strong>Solicitante:</strong> ${menteeName}</div>
        <div class="info-item"><strong>Data e Hora:</strong> ${formatDateTimeBR(scheduledAt)}</div>
        <div class="info-item"><strong>Mensagem do Mentorado:</strong><br/>${message}</div>
    </div>
    <div class="button-container">
        <a href="${confirmUrl}" class="button">Confirmar Agendamento</a>
    </div>
    <p style="font-size: 13px; color: ${COLORS.muted}; text-align: center;">Você também pode gerenciar suas solicitações diretamente pelo seu painel.</p>
  `;
  await sendEmail(
    mentorEmail,
    `Nova solicitação de mentoria de ${menteeName}`,
    getEmailLayout("Nova Solicitação de Mentoria", content, { signatureType: "team" })
  );
}

/**
 * Envia email de confirmação de agendamento para mentor e mentee (assinado pessoalmente pelo Paul Pessoa)
 */
export async function sendAppointmentConfirmation(data: AppointmentConfirmationData): Promise<void> {
  const { mentorEmail, menteeEmail, mentorName, menteeName, scheduledAt, meetLink, calendarLink } = data;
  const formattedDate = new Date(scheduledAt).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "full",
    timeStyle: "short"
  });

  const content = `
    <h2>Sua mentoria está confirmada!</h2>
    <p>Tudo pronto! A sessão de mentoria voluntária foi agendada com sucesso:</p>
    <div class="info-box" style="border-left: 4px solid ${COLORS.primary};">
        <div class="info-item"><strong>Mentor(a):</strong> ${mentorName}</div>
        <div class="info-item"><strong>Mentorado(a):</strong> ${menteeName}</div>
        <div class="info-item"><strong>Data e Hora:</strong> ${formattedDate}</div>
    </div>
    ${meetLink ? `
    <div class="button-container">
        <a href="${meetLink}" class="button">Entrar no Google Meet</a>
    </div>` : ''}
    ${calendarLink ? `<p style="text-align: center; margin-top: -10px; margin-bottom: 20px;"><a href="${calendarLink}" style="color: ${COLORS.primary}; font-weight: 600; font-size: 14px; text-decoration: underline;">Adicionar ao Google Calendar</a></p>` : ''}
    <div class="divider"></div>
    <p><strong>Dica:</strong> Recomendamos entrar com 5 minutos de antecedência e anotar suas dúvidas com antecedência. Tenham uma conversa inspiradora.</p>
  `;
  await sendEmail(
    [mentorEmail, menteeEmail],
    "Sessão de Mentoria Confirmada",
    getEmailLayout("Mentoria Confirmada", content, { signatureType: "personal" })
  );
}

/**
 * Envia email de cancelamento de agendamento informando o motivo
 */
export async function sendAppointmentCancellation(data: AppointmentCancellationData): Promise<void> {
  const formattedDate = formatDateTimeBR(data.scheduledAt);
  const isCancelledByRecipient = data.cancelledByName === data.recipientName;
  const noticeText = isCancelledByRecipient
    ? `Você cancelou a sessão de mentoria agendada para <strong>${formattedDate}</strong>.`
    : `Informamos que <strong>${data.cancelledByName}</strong> precisou cancelar a mentoria agendada para <strong>${formattedDate}</strong>.`;

  const content = `
    <h2>Mentoria Cancelada</h2>
    <p>Olá, ${data.recipientName}.</p>
    <p>${noticeText}</p>
    <div class="info-box" style="border-left: 4px solid #EF4444;">
        <div class="info-item"><strong>Data e Hora Original:</strong> ${formattedDate}</div>
        <div class="info-item"><strong>Cancelado por:</strong> ${data.cancelledByName}</div>
        <div class="info-item"><strong>Motivo informado:</strong><br/><em>"${data.reason}"</em></div>
    </div>
    <div class="button-container">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.menvo.com.br'}/mentors" class="button">Explorar outros mentores</a>
    </div>
    <p style="font-size: 13px; color: ${COLORS.muted};">Imprevistos e conflitos de agenda acontecem. Você pode encontrar novos horários e outros mentores disponíveis quando desejar.</p>
  `;
  await sendEmail(
    data.recipientEmail,
    `Mentoria de ${formattedDate} cancelada`,
    getEmailLayout("Mentoria Cancelada", content, { signatureType: "team" })
  );
}

/**
 * Notifica o administrador sobre uma nova solicitação de mentor
 */
export async function sendAdminNewMentorNotification(data: {
  userName: string;
  userEmail: string;
}): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || "contato@menvo.com.br";
  const content = `
    <h2>Nova Solicitação de Mentor</h2>
    <p>Olá, Admin. Um usuário acaba de solicitar a validação de perfil como <strong>Mentor</strong> na plataforma.</p>
    <div class="info-box">
        <div class="info-item"><strong>Nome:</strong> ${data.userName}</div>
        <div class="info-item"><strong>E-mail:</strong> ${data.userEmail}</div>
        <div class="info-item"><strong>Data:</strong> ${new Date().toLocaleString("pt-BR")}</div>
    </div>
    <div class="button-container">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.menvo.com.br'}/dashboard/admin/users" class="button">Verificar no Painel Admin</a>
    </div>
    <p>Por favor, revise o perfil e os documentos para aprovação em até 48h.</p>
  `;
  await sendEmail(
    adminEmail,
    `Novo Mentor Pendente: ${data.userName}`,
    getEmailLayout("Nova Solicitação de Mentor", content, { signatureType: "team" })
  );
}

/**
 * Notifica o mentor que uma nova avaliação foi publicada no seu perfil
 */
export async function sendMentorNewReviewNotification(data: {
  mentorEmail: string;
  mentorName: string;
  menteeName: string;
  rating: number;
  comment: string | null;
}): Promise<void> {
  const content = `
    <h2>Você recebeu uma nova avaliação</h2>
    <p>Olá, ${data.mentorName}! Um mentorado acaba de deixar um depoimento sobre a sua mentoria.</p>
    <div class="info-box" style="border-left: 4px solid #F59E0B">
        <p><strong>De:</strong> ${data.menteeName}</p>
        <p><strong>Nota:</strong> ${data.rating}/5</p>
        ${data.comment ? `<p style="margin-top: 10px; font-style: italic;">"${data.comment}"</p>` : ''}
    </div>
    <p>Esta avaliação já está visível no seu perfil público e ajuda a inspirar novos mentorados.</p>
    <div class="button-container">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.menvo.com.br'}/dashboard/mentor" class="button">Ver no meu Dashboard</a>
    </div>
    <p>Muito obrigado por compartilhar seu conhecimento na Menvo.</p>
  `;
  await sendEmail(
    data.mentorEmail,
    `Nova avaliação de ${data.menteeName} (${data.rating}/5)`,
    getEmailLayout("Nova Avaliação Recebida", content, { signatureType: "team" })
  );
}

/**
 * Helper para envio via Brevo API
 */
async function sendEmail(to: string | string[], subject: string, htmlContent: string) {
  const recipients = Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }];
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
          email: process.env.BREVO_SENDER_EMAIL || "contato@menvo.com.br"
        },
        to: recipients,
        subject,
        htmlContent
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

/**
 * Retorna o HTML de preview de um template para o painel de visualização administrativa
 */
export function getEmailTemplatePreviewHtml(templateKey: string): string {
  switch (templateKey) {
    case 'confirmation': {
      const content = `
        <h2>Sua mentoria está confirmada!</h2>
        <p>Tudo pronto! A sessão de mentoria voluntária foi agendada com sucesso:</p>
        <div class="info-box" style="border-left: 4px solid ${COLORS.primary};">
            <div class="info-item"><strong>Mentor(a):</strong> Dr. Carlos Mendes</div>
            <div class="info-item"><strong>Mentorado(a):</strong> Mariana Silva</div>
            <div class="info-item"><strong>Data e Hora:</strong> Terça-feira, 15 de Setembro de 2026 às 14:00</div>
        </div>
        <div class="button-container">
            <a href="https://meet.google.com/abc-defg-hij" class="button">Entrar no Google Meet</a>
        </div>
        <p style="text-align: center; margin-top: -10px; margin-bottom: 20px;"><a href="#" style="color: ${COLORS.primary}; font-weight: 600; font-size: 14px; text-decoration: underline;">Adicionar ao Google Calendar</a></p>
        <div class="divider"></div>
        <p><strong>Dica:</strong> Recomendamos entrar com 5 minutos de antecedência e anotar suas dúvidas com antecedência. Tenham uma conversa inspiradora.</p>
      `;
      return getEmailLayout("Mentoria Confirmada", content, { signatureType: "personal" });
    }
    case 'verification': {
      const content = `
        <h2>Olá, Rodrigo!</h2>
        <p>Analisamos com atenção o seu perfil de mentor na Menvo.</p>
        <div class="info-box" style="border-left: 4px solid #007585">
            <p style="margin-bottom: 5px;"><strong>Status:</strong> Aprovado</p>
            <p><strong>Observações:</strong> Perfil profissional verificado com sucesso. Experiência e formação alinhadas com o propósito da nossa comunidade.</p>
        </div>
        <div class="button-container">
            <a href="https://www.menvo.com.br/dashboard" class="button">Acessar meu Dashboard</a>
        </div>
        <p>Seja muito bem-vindo(a) à nossa rede de mentores voluntários. Sua experiência fará a diferença na carreira de muitos talentos!</p>
      `;
      return getEmailLayout("Perfil Aprovado", content, { signatureType: "personal" });
    }
    case 'feedback': {
      const content = `
        <h2>Como foi sua mentoria?</h2>
        <p>Olá, Lucas! Sua sessão com <strong>Dra. Beatriz Santos</strong> terminou há pouco tempo.</p>
        <p>Sua avaliação é essencial para fortalecer a comunidade e reconhecer a dedicação voluntária do mentor na plataforma.</p>
        <div class="button-container">
            <a href="https://www.menvo.com.br/dashboard/mentee" class="button">Avaliar Mentoria Agora</a>
        </div>
        <p>Leva menos de 1 minuto e faz toda a diferença para quem doa seu tempo para ensinar.</p>
      `;
      return getEmailLayout("Avaliação de Mentoria", content, { signatureType: "personal" });
    }
    case 'cancellation': {
      const content = `
        <h2>Mentoria Cancelada</h2>
        <p>Olá, Gabriel.</p>
        <p>Informamos que <strong>Juliana Ramos</strong> precisou cancelar a mentoria agendada para <strong>12/09/2026 às 16:00</strong>.</p>
        <div class="info-box" style="border-left: 4px solid #EF4444;">
            <div class="info-item"><strong>Data e Hora Original:</strong> 12/09/2026 às 16:00</div>
            <div class="info-item"><strong>Cancelado por:</strong> Juliana Ramos</div>
            <div class="info-item"><strong>Motivo informado:</strong><br/><em>"Conflito de agenda imprevisto no trabalho. Peço desculpas pelo transtorno."</em></div>
        </div>
        <div class="button-container">
            <a href="https://www.menvo.com.br/mentors" class="button">Explorar outros mentores</a>
        </div>
        <p style="font-size: 13px; color: ${COLORS.muted};">Imprevistos acontecem. Você pode encontrar novos horários e outros mentores disponíveis quando desejar.</p>
      `;
      return getEmailLayout("Mentoria Cancelada", content, { signatureType: "team" });
    }
    case 'reminder': {
      const content = `
        <h2>Lembrete: Sua mentoria é hoje</h2>
        <p>Olá, Rafael. Passando para lembrar que sua sessão de mentoria com <strong>Camila Torres</strong> está agendada para hoje às <strong>19:00</strong>.</p>
        <div class="info-box">
            <p><strong>Evento:</strong> Mentoria MENVO</p>
            <p><strong>Horário:</strong> 19:00 (Horário de Brasília)</p>
        </div>
        <div class="button-container">
            <a href="https://meet.google.com/xyz-uvwx-rst" class="button">Entrar no Google Meet</a>
        </div>
        <p>Prepare suas dúvidas e aproveite ao máximo a troca de experiências.</p>
      `;
      return getEmailLayout("Lembrete de Mentoria", content, { signatureType: "team" });
    }
    default:
      return getEmailLayout("Preview Menvo", "<p>Selecione um template para visualizar.</p>", { signatureType: "personal" });
  }
}
