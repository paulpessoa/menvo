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

/** Canal de contato do encarregado de dados (LGPD art. 41), citado no rodapé de todo e-mail. */
const PRIVACY_CONTACT = 'contato@menvo.com.br';

/**
 * Escapa texto livre fornecido pelo usuário antes de interpolar em HTML de
 * e-mail. Necessário para qualquer campo de formulário longo (bio,
 * abordagem de mentoria etc.) - ao contrário de nome/e-mail, esses campos
 * são grandes o bastante para um usuário mal-intencionado esconder markup.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
        .header { background: ${COLORS.white}; padding: 32px 35px; text-align: center; border-bottom: 1px solid ${COLORS.divider}; }
        .header h1 { font-size: 22px; font-weight: 700; margin: 0; letter-spacing: 0.3px; color: ${COLORS.text}; }
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
        <div class="header">
            <img src="https://raw.githubusercontent.com/paulpessoa/menvo/main/public/menvo-logo-light.png" alt="${title}" height="32" style="display: block; margin: 0 auto; max-width: 100%; height: auto; max-height: 32px;" />
        </div>
        <div class="content">
            ${content}
            ${signatureHtml}
        </div>
        <div class="footer">
            <p>Este e-mail foi enviado automaticamente pela MENVO.</p>
            <p>© ${new Date().getFullYear()} MENVO. Todos os direitos reservados.</p>
            ${opts.footerExtra || ''}
            <p style="margin-top: 12px;">Cuidamos dos seus dados conforme a LGPD. Leia nossa
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.menvo.com.br'}/privacy" style="color: ${COLORS.muted}; text-decoration: underline;">Política de Privacidade</a>
              ou fale com o encarregado de dados em <a href="mailto:${PRIVACY_CONTACT}" style="color: ${COLORS.muted}; text-decoration: underline;">${PRIVACY_CONTACT}</a>.
            </p>
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
    <p>Olá, ${escapeHtml(data.userName)}. Passando para lembrar que sua sessão de mentoria com <strong>${escapeHtml(data.otherPersonName)}</strong> está agendada para hoje às <strong>${formattedTime}</strong>.</p>
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
    <p>Olá, ${escapeHtml(data.userName)}! Sua sessão com <strong>${escapeHtml(data.mentorName)}</strong> terminou há pouco tempo.</p>
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
    <h2>Olá, ${escapeHtml(userName)}!</h2>
    <p>Analisamos com atenção o seu perfil de mentor na Menvo.</p>
    <div class="info-box">
        <p style="margin-bottom: 5px;"><strong>Status:</strong> ${isApproved ? 'Aprovado' : 'Ajustes Necessários'}</p>
        ${notes ? `<p><strong>Observações:</strong> ${escapeHtml(notes)}</p>` : ''}
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
    <h2>Olá, ${escapeHtml(mentorName)}!</h2>
    <p>Você recebeu uma nova solicitação de mentoria na plataforma Menvo.</p>
    <div class="info-box">
        <div class="info-item"><strong>Solicitante:</strong> ${escapeHtml(menteeName)}</div>
        <div class="info-item"><strong>Data e Hora:</strong> ${formatDateTimeBR(scheduledAt)}</div>
        <div class="info-item"><strong>Mensagem do Mentorado:</strong><br/>${escapeHtml(message).replace(/\n/g, '<br/>')}</div>
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
    <div class="info-box">
        <div class="info-item"><strong>Mentor(a):</strong> ${escapeHtml(mentorName)}</div>
        <div class="info-item"><strong>Mentorado(a):</strong> ${escapeHtml(menteeName)}</div>
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
    : `Informamos que <strong>${escapeHtml(data.cancelledByName)}</strong> precisou cancelar a mentoria agendada para <strong>${formattedDate}</strong>.`;

  const content = `
    <h2>Mentoria Cancelada</h2>
    <p>Olá, ${escapeHtml(data.recipientName)}.</p>
    <p>${noticeText}</p>
    <div class="info-box">
        <div class="info-item"><strong>Data e Hora Original:</strong> ${formattedDate}</div>
        <div class="info-item"><strong>Cancelado por:</strong> ${escapeHtml(data.cancelledByName)}</div>
        <div class="info-item"><strong>Motivo informado:</strong><br/><em>"${escapeHtml(data.reason)}"</em></div>
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
 * Envia lembrete ao mentor sobre pedido pendente há mais de 24h
 */
export async function sendPendingRequestReminder(data: { mentorEmail: string; mentorName: string; menteeName: string; scheduledAt: string; }): Promise<void> {
  const formattedDate = formatDateTimeBR(data.scheduledAt);
  const content = `
    <h2>Pedido de mentoria aguardando sua resposta</h2>
    <p>Olá, ${escapeHtml(data.mentorName)}.</p>
    <p>${escapeHtml(data.menteeName)} pediu uma sessão para <strong>${formattedDate}</strong> e ainda aguarda sua resposta. Se não puder atender, recuse o pedido para que ele possa procurar outro mentor.</p>
    <div class="button-container">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.menvo.com.br'}/dashboard/mentor" class="button">Responder pedido</a>
    </div>
  `;
  await sendEmail(
    data.mentorEmail,
    `Pedido de mentoria aguardando sua resposta`,
    getEmailLayout("Pedido Pendente", content, { signatureType: "team" })
  );
}

/**
 * Informa o mentorado que o pedido expirou pois o horário passou
 */
export async function sendPendingRequestExpired(data: { menteeEmail: string; menteeName: string; mentorName: string; scheduledAt: string; }): Promise<void> {
  const formattedDate = formatDateTimeBR(data.scheduledAt);
  const content = `
    <h2>Seu pedido de mentoria expirou</h2>
    <p>Olá, ${escapeHtml(data.menteeName)}.</p>
    <p>Seu pedido de sessão com ${escapeHtml(data.mentorName)} para <strong>${formattedDate}</strong> não foi confirmado a tempo e foi cancelado automaticamente. Isso acontece - mentores são voluntários. Que tal pedir um horário com outro mentor?</p>
    <div class="button-container">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.menvo.com.br'}/mentors" class="button">Encontrar outro mentor</a>
    </div>
  `;
  await sendEmail(
    data.menteeEmail,
    `Seu pedido de mentoria expirou`,
    getEmailLayout("Pedido Expirado", content, { signatureType: "team" })
  );
}

/**
 * Notifica o administrador sobre uma nova solicitação de mentor
 */
export async function sendAdminNewMentorNotification(data: {
  userName: string;
  userEmail: string;
  mentorshipApproach?: string;
  whatToExpect?: string;
}): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || "contato@menvo.com.br";
  const approachSection = data.mentorshipApproach
    ? `<div class="info-item" style="margin-top: 8px;"><strong>Como pretende conduzir as mentorias:</strong><br/>${escapeHtml(data.mentorshipApproach).replace(/\n/g, '<br/>')}</div>`
    : '';
  const expectSection = data.whatToExpect
    ? `<div class="info-item" style="margin-top: 8px;"><strong>O que espera do mentorado:</strong><br/>${escapeHtml(data.whatToExpect).replace(/\n/g, '<br/>')}</div>`
    : '';
  const content = `
    <h2>Nova Solicitação de Mentor</h2>
    <p>Olá, Admin. Um usuário acaba de solicitar a validação de perfil como <strong>Mentor</strong> na plataforma.</p>
    <div class="info-box">
        <div class="info-item"><strong>Nome:</strong> ${escapeHtml(data.userName)}</div>
        <div class="info-item"><strong>E-mail:</strong> ${escapeHtml(data.userEmail)}</div>
        <div class="info-item"><strong>Data:</strong> ${new Date().toLocaleString("pt-BR")}</div>
        ${approachSection}
        ${expectSection}
    </div>
    <div class="button-container">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.menvo.com.br'}/dashboard/admin/verifications" class="button">Verificar no Painel Admin</a>
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
 * Notifica o administrador sobre um novo pedido de mentoria. Usa o layout
 * padrão e escapa todo texto vindo do usuário (antes era um `fetch` inline
 * com HTML cru em app/api/appointments/create).
 */
export async function sendAdminNewAppointmentNotification(data: {
  mentorName: string;
  mentorEmail: string;
  menteeName: string;
  menteeEmail: string;
  scheduledAt: string;
  notes: string;
}): Promise<{ success: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_EMAIL || "contato@menvo.com.br";
  const content = `
    <h2>Nova solicitação de mentoria</h2>
    <div class="info-box">
        <div class="info-item"><strong>Mentor:</strong> ${escapeHtml(data.mentorName)} (${escapeHtml(data.mentorEmail)})</div>
        <div class="info-item"><strong>Mentorado:</strong> ${escapeHtml(data.menteeName)} (${escapeHtml(data.menteeEmail)})</div>
        <div class="info-item"><strong>Data:</strong> ${formatDateTimeBR(data.scheduledAt)}</div>
        <div class="info-item"><strong>Notas:</strong><br/>${escapeHtml(data.notes).replace(/\n/g, '<br/>')}</div>
    </div>
  `;
  return await sendEmail(
    adminEmail,
    `Nova solicitação: ${data.menteeName} -> ${data.mentorName}`,
    getEmailLayout("Nova Solicitação de Mentoria", content, { signatureType: "team" })
  );
}

/**
 * Notifica o administrador sobre uma nova organização interessada (lead)
 */
export async function sendAdminNewOrganizationLead(data: {
  org_name: string;
  org_type: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string | null;
  people_estimate: string;
  message?: string | null;
  locale?: string | null;
}): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || "contato@menvo.com.br";

  const typeMap: Record<string, string> = {
    ngo: 'ONG / Terceiro Setor',
    company: 'Empresa',
    school: 'Instituição de Ensino',
    event: 'Evento',
    other: 'Outro'
  };
  const typeStr = typeMap[data.org_type] || data.org_type;

  const sizeMap: Record<string, string> = {
    '1-20': '1 a 20',
    '21-100': '21 a 100',
    '101-500': '101 a 500',
    '500+': 'Mais de 500'
  };
  const sizeStr = sizeMap[data.people_estimate] || data.people_estimate;

  const content = `
    <h2>Nova Organização Interessada</h2>
    <p>Olá, Admin. Uma nova organização preencheu o formulário de interesse na plataforma.</p>
    <div class="info-box">
        <div class="info-item"><strong>Organização:</strong> ${escapeHtml(data.org_name)}</div>
        <div class="info-item"><strong>Tipo:</strong> ${typeStr}</div>
        <div class="info-item"><strong>Tamanho (pessoas):</strong> ${sizeStr}</div>
        <div class="info-item"><strong>Contato:</strong> ${escapeHtml(data.contact_name)}</div>
        <div class="info-item"><strong>E-mail:</strong> ${escapeHtml(data.contact_email)}</div>
        ${data.contact_phone ? `<div class="info-item"><strong>Telefone:</strong> ${escapeHtml(data.contact_phone)}</div>` : ''}
        ${data.locale ? `<div class="info-item"><strong>Idioma (locale):</strong> ${data.locale}</div>` : ''}
        ${data.message ? `<div class="info-item" style="margin-top: 8px;"><strong>Mensagem:</strong><br/>${escapeHtml(data.message).replace(/\n/g, '<br/>')}</div>` : ''}
    </div>
    <div class="button-container">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.menvo.com.br'}/dashboard/admin/org-leads" class="button">Ver pedidos no painel</a>
    </div>
  `;
  await sendEmail(
    adminEmail,
    `Nova organização interessada: ${data.org_name}`,
    getEmailLayout("Nova Organização Interessada", content, { signatureType: "team" })
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
    <p>Olá, ${escapeHtml(data.mentorName)}! Um mentorado acaba de deixar um depoimento sobre a sua mentoria.</p>
    <div class="info-box">
        <p><strong>De:</strong> ${escapeHtml(data.menteeName)}</p>
        <p><strong>Nota:</strong> ${data.rating}/5</p>
        ${data.comment ? `<p style="margin-top: 10px; font-style: italic;">"${escapeHtml(data.comment)}"</p>` : ''}
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

// ---------------------------------------------------------------------------
// Convites de reengajamento (base histórica importada, ex.: JotForm)
// ---------------------------------------------------------------------------

/**
 * Converte o corpo do e-mail escrito pelo admin (texto simples, com
 * `{{primeiro_nome}}` como placeholder) em HTML seguro: cada linha em
 * branco separa um parágrafo, e todo o texto passa por `escapeHtml` antes
 * de virar markup - o admin nunca escreve HTML diretamente aqui.
 */
function renderPlainTextBody(bodyText: string, firstName: string): string {
  const withName = bodyText.replace(/\{\{\s*primeiro_nome\s*\}\}/gi, firstName);
  return withName
    .split(/\n\s*\n/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
    .map(paragraph => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
}

/**
 * E-mail de campanha de reengajamento (ex.: base do Estágio Recife
 * importada do JotForm): avisa que a Menvo existe, convida a pessoa a
 * completar o perfil ou apoiar como mentor(a), e - obrigatório por LGPD -
 * dá uma saída fácil, sem login, para parar de receber e-mails ou apagar
 * os dados. `inviteUrl` já aponta para a página pública `/convite/[token]`;
 * esta função só decora os `?intent=` de cada ação (nunca executa nada
 * sozinha - ver docs/domains/reengagement-invites.md §3.2).
 *
 * O corpo (`bodyText`) é escrito/editado pelo admin no modal de envio; os
 * botões e o aviso de LGPD abaixo são fixos e não podem ser removidos por
 * quem preenche o formulário do modal.
 */
export interface ReengagementInviteData {
  name: string;
  bodyText: string;
  inviteUrl: string;
  originNote?: string;
}

/**
 * Builds the full HTML for a reengagement invite. Shared by the real send
 * (`sendReengagementInvite`) and the admin preview endpoint, so what the
 * admin previews is byte-for-byte what gets sent.
 */
export function buildReengagementInviteHtml(data: ReengagementInviteData): string {
  const firstName = escapeHtml(data.name.split(" ")[0] || data.name);
  const acceptUrl = `${data.inviteUrl}?intent=participate`;
  const mentorUrl = `${data.inviteUrl}?intent=mentor`;
  const optOutUrl = `${data.inviteUrl}?intent=optout`;
  const originNote = data.originNote
    || "Você está recebendo este e-mail porque preencheu o formulário do Estágio Recife.";

  const content = `
    ${renderPlainTextBody(data.bodyText, firstName)}
    <div class="button-container">
        <a href="${acceptUrl}" class="button">Acessar a Menvo e completar meu perfil</a>
    </div>
    <p style="text-align: center; margin-top: -10px; margin-bottom: 20px;">
        <a href="${mentorUrl}" style="color: ${COLORS.primary}; font-weight: 600; font-size: 14px; text-decoration: underline;">Quero apoiar como mentor(a)</a>
    </p>
  `;

  const footerExtra = `
    <p style="margin-top: 16px;">${escapeHtml(originNote)} Se não quiser participar,
      <a href="${optOutUrl}" style="color: ${COLORS.muted}; text-decoration: underline;">clique aqui</a>
      para parar de receber e-mails ou apagar seus dados e seu perfil.
    </p>
  `;

  return getEmailLayout("Menvo", content, { signatureType: "personal", footerExtra });
}

export async function sendReengagementInvite(data: ReengagementInviteData & {
  email: string;
  subject: string;
}): Promise<{ success: boolean; error?: string }> {
  return await sendEmail(data.email, data.subject, buildReengagementInviteHtml(data));
}

/**
 * Lembrete de fim de semana para mentores atualizarem a agenda. Sem horário
 * livre cadastrado o mentee não consegue pedir sessão, então este é o e-mail
 * que mais move agendamentos. Menciona a sincronização com o Google Agenda
 * (opcional, só lê ocupado/livre) porque ela tira o trabalho de conferir
 * compromissos pessoais na mão.
 */
export function buildMentorAgendaReminderHtml(data: { name: string }): string {
  const firstName = escapeHtml(data.name.split(" ")[0] || data.name);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.menvo.com.br";
  const agendaUrl = `${baseUrl}/dashboard/mentor/availability`;

  const content = `
    <img src="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1100&q=80"
      alt="Agenda aberta sobre uma mesa, com café e caneta"
      width="480" style="display: block; width: 100%; max-width: 480px; height: auto; border-radius: 10px; margin: 0 auto 24px auto;" />
    <h2>O fim de semana tá chegando, ${firstName}!</h2>
    <p>Será que rola um tempinho livre? Que tal já preparar a próxima semana?</p>
    <p>Quem quer uma mentoria só consegue pedir sessão nos horários que você deixa abertos. Se a sua agenda estiver vazia ou desatualizada, a pessoa nem chega a te encontrar. Leva 2 minutos: adicione ou ajuste seus horários para os próximos dias.</p>
    <div class="button-container">
        <a href="${agendaUrl}" class="button">Atualizar minha agenda</a>
    </div>
    <div class="info-box">
        <p style="margin-bottom: 0;"><strong>Novidade:</strong> agora você pode conectar o seu Google Agenda. A Menvo só verifica se você está ocupado ou livre em cada horário, sem ver título, convidados ou detalhes dos seus eventos, e esconde automaticamente os horários que batem com seus compromissos pessoais. Fica em "Sincronização Pessoal", na mesma página da agenda.</p>
    </div>
    <p>Obrigado por dedicar seu tempo a quem está começando. Tenha um ótimo fim de semana!</p>
  `;

  return getEmailLayout("Menvo", content, { signatureType: "personal" });
}

export async function sendMentorAgendaReminder(data: {
  email: string;
  name: string;
}): Promise<{ success: boolean; error?: string }> {
  return await sendEmail(
    data.email,
    "Já preparou a sua agenda para a próxima semana?",
    buildMentorAgendaReminderHtml({ name: data.name })
  );
}

// ---------------------------------------------------------------------------
// Retenção automática de contas importadas (JotForm) nunca ativadas
// ---------------------------------------------------------------------------

/**
 * Aviso de que uma conta importada e nunca acessada será apagada em breve.
 * Reaproveita o mesmo link `/convite/[token]` do fluxo de reengajamento -
 * "Quero manter minha conta" leva ao login/definição de senha, e há também
 * uma saída para apagar os dados imediatamente. Ver
 * docs/domains/account-retention.md §4.3.
 */
export function buildRetentionNoticeHtml(data: {
  name: string;
  inviteUrl: string;
  deletionDate: string;
  daysLeft: 30 | 1;
}): string {
  const firstName = escapeHtml(data.name.split(" ")[0] || data.name || "");
  const keepUrl = `${data.inviteUrl}?intent=participate`;
  const deleteNowUrl = `${data.inviteUrl}?intent=optout`;
  const formattedDate = new Date(data.deletionDate).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  const intro = data.daysLeft === 30
    ? `<p>Você preencheu o formulário do Estágio Recife e uma conta na Menvo foi criada para você, mas ela nunca chegou a ser acessada.</p>
       <p>Para manter seus dados sob controle, contas assim são apagadas automaticamente depois de um tempo sem uso. Sua conta está programada para ser apagada em <strong>${formattedDate}</strong>.</p>`
    : `<p><strong>Este é o último aviso.</strong> Sua conta na Menvo, criada a partir do formulário do Estágio Recife e nunca acessada, será apagada amanhã, dia <strong>${formattedDate}</strong>.</p>`;

  const content = `
    <h2>${firstName ? `Olá, ${firstName}` : "Olá"}!</h2>
    ${intro}
    <div class="button-container">
        <a href="${keepUrl}" class="button">Quero manter minha conta</a>
    </div>
    <p style="text-align: center; margin-top: -10px; margin-bottom: 20px;">
        <a href="${deleteNowUrl}" style="color: ${COLORS.muted}; font-weight: 600; font-size: 14px; text-decoration: underline;">Pode apagar agora</a>
    </p>
  `;

  const footerExtra = `
    <p style="margin-top: 16px;">Você está recebendo este e-mail porque preencheu o formulário do Estágio Recife.</p>
  `;

  return getEmailLayout("Menvo", content, { signatureType: "personal", footerExtra });
}

export async function sendRetentionNotice(data: {
  name: string;
  email: string;
  inviteUrl: string;
  deletionDate: string;
  daysLeft: 30 | 1;
}): Promise<{ success: boolean; error?: string }> {
  const subject = data.daysLeft === 30
    ? "Sua conta na Menvo será apagada em 30 dias"
    : "Último aviso: sua conta na Menvo será apagada amanhã";
  return await sendEmail(data.email, subject, buildRetentionNoticeHtml(data));
}

/**
 * Confirmação enviada no momento da exclusão. Sem token nem link de conta -
 * a conta já não existe mais.
 */
export function buildRetentionDeletionConfirmationHtml(data: { name: string }): string {
  const firstName = escapeHtml(data.name.split(" ")[0] || data.name || "");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.menvo.com.br";

  const content = `
    <h2>${firstName ? `Olá, ${firstName}` : "Olá"}!</h2>
    <p>Como avisamos, sua conta na Menvo, criada a partir do formulário do Estágio Recife e nunca acessada, foi apagada.</p>
    <p>Removemos seu perfil, as respostas do formulário importado e os arquivos enviados. Mantemos apenas um registro anônimo (que não permite identificá-lo) do atendimento a este pedido, para comprovação e para evitar um novo contato.</p>
    <p>Se quiser voltar a fazer parte da Menvo no futuro, você pode criar uma conta nova quando desejar.</p>
    <div class="button-container">
        <a href="${appUrl}/auth/register" class="button">Criar uma conta nova</a>
    </div>
  `;

  return getEmailLayout("Menvo", content, { signatureType: "personal" });
}

export async function sendRetentionDeletionConfirmation(data: {
  name: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  return await sendEmail(data.email, "Seus dados foram apagados da Menvo", buildRetentionDeletionConfirmationHtml(data));
}

// ---------------------------------------------------------------------------
// Análise do quiz de carreira (/quiz)
// ---------------------------------------------------------------------------

export interface QuizResultsEmailData {
  name: string;
  title: string;
  summary: string;
  /** Link com o token `?k=` (lib/quiz/result-link.ts) - abre a análise e permite criar a conta. */
  resultUrl: string;
  isAuthenticated?: boolean;
}

/**
 * E-mail curto: só o título e um trecho do resumo. A análise completa
 * (mentores, conselhos, próximos passos) fica atrás do botão, na página de
 * resultados - onde a pessoa também pode criar uma senha e guardar tudo na
 * conta. Título e resumo vêm da IA (que lê texto livre do usuário), por isso
 * passam por escapeHtml como qualquer outro texto não confiável.
 */
export function buildQuizResultsEmailHtml(data: QuizResultsEmailData): string {
  const firstName = escapeHtml(data.name.split(" ")[0] || data.name || "");
  const summary = data.summary.length > 320 ? `${data.summary.slice(0, 317).trimEnd()}...` : data.summary;

  const content = `
    <h2>${firstName ? `Olá, ${firstName}!` : "Olá!"} Sua análise está pronta</h2>
    <div class="info-box">
        <p style="font-weight: 700; margin-bottom: 8px;">${escapeHtml(data.title)}</p>
        <p style="margin-bottom: 0; color: ${COLORS.muted};">${escapeHtml(summary)}</p>
    </div>
    <p>Na análise completa estão os mentores sugeridos para o seu momento, conselhos práticos e os próximos passos.</p>
    <div class="button-container">
        <a href="${data.resultUrl}" class="button">Ver minha análise completa</a>
    </div>
    ${!data.isAuthenticated ? `
    <p style="font-size: 13px; color: ${COLORS.muted}; text-align: center;">Pelo mesmo link você pode criar uma senha e guardar a análise na sua conta da Menvo.</p>
    ` : ''}
  `;

  const footerExtra = `
    <p style="margin-top: 16px;">Você recebeu este e-mail porque respondeu o questionário de carreira da Menvo.</p>
  `;

  return getEmailLayout("Sua análise de carreira", content, { signatureType: "personal", footerExtra });
}

export async function sendQuizResultsEmail(data: QuizResultsEmailData & { email: string }): Promise<{ success: boolean; error?: string }> {
  return await sendEmail(data.email, "Sua análise de carreira está pronta", buildQuizResultsEmailHtml(data));
}

// ---------------------------------------------------------------------------
// Organizações parceiras (multi-tenant)
// ---------------------------------------------------------------------------

type OrgRecipientRole = "mentor" | "mentee";

function orgInviteContent(firstName: string, orgName: string, appUrl: string, role: OrgRecipientRole) {
  const body = role === "mentor"
    ? `<p>A <strong>${orgName}</strong> é uma organização parceira da Menvo e quer contar com você como mentor(a) do grupo dela na plataforma.</p>
       <p>Ao aceitar, você aparece como mentor da ${orgName} e pode receber pedidos de mentoria vindos dos beneficiários dela - sua agenda e seu processo de aceite continuam exatamente os mesmos.</p>`
    : `<p>A <strong>${orgName}</strong> é uma organização parceira da Menvo e quer acompanhar sua jornada de mentoria na plataforma.</p>
       <p>Ao aceitar, a organização passa a ver seu progresso (sessões agendadas, quiz de carreira) para te apoiar melhor - sua conta continua exatamente a mesma.</p>`;
  return `
    <h2>Você foi convidado(a) para a ${orgName}</h2>
    <p>Olá, ${firstName}!</p>
    ${body}
    <div class="button-container">
        <a href="${appUrl}/profile?tab=organizations" class="button">Ver e aceitar o convite</a>
    </div>
    <p style="font-size: 13px; color: ${COLORS.muted};">Você pode recusar ou sair da organização a qualquer momento na aba "Organizações" do seu perfil.</p>
  `;
}

export async function sendOrgInvite(data: {
  name: string;
  email: string;
  orgName: string;
  recipientRole: OrgRecipientRole;
}): Promise<{ success: boolean; error?: string }> {
  const firstName = escapeHtml(data.name.split(" ")[0] || data.name);
  const orgName = escapeHtml(data.orgName);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.menvo.com.br";
  return await sendEmail(
    data.email,
    `Convite: participe da ${data.orgName} na Menvo`,
    getEmailLayout("Convite de organização", orgInviteContent(firstName, orgName, appUrl, data.recipientRole), { signatureType: "none" })
  );
}

function orgJoinRequestContent(requesterName: string, requesterEmail: string, orgName: string, appUrl: string, requesterRole: OrgRecipientRole | null) {
  const roleLabel = requesterRole === "mentor" ? " (mentor)" : requesterRole === "mentee" ? " (mentorado)" : "";
  return `
    <h2>Nova solicitação para entrar na ${orgName}</h2>
    <p><strong>${requesterName}${roleLabel}</strong> (${requesterEmail}) pediu para participar da <strong>${orgName}</strong> na Menvo.</p>
    <div class="button-container">
        <a href="${appUrl}/dashboard/org" class="button">Revisar solicitação</a>
    </div>
    <p style="font-size: 13px; color: ${COLORS.muted};">Você pode aprovar ou recusar no painel da organização. A pessoa só passa a fazer parte do grupo depois da sua aprovação.</p>
  `;
}

export async function sendOrgJoinRequestToAdmin(data: {
  adminEmail: string;
  requesterName: string;
  requesterEmail: string;
  orgName: string;
  requesterRole?: OrgRecipientRole | null;
}): Promise<{ success: boolean; error?: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.menvo.com.br";
  return await sendEmail(
    data.adminEmail,
    `Solicitação para entrar na ${data.orgName}`,
    getEmailLayout(
      "Nova solicitação",
      orgJoinRequestContent(escapeHtml(data.requesterName), escapeHtml(data.requesterEmail), escapeHtml(data.orgName), appUrl, data.requesterRole ?? null),
      { signatureType: "none" }
    )
  );
}

function orgMembershipApprovedContent(firstName: string, orgName: string, appUrl: string, role: OrgRecipientRole) {
  const cta = role === "mentor"
    ? { href: `${appUrl}/dashboard/mentor/availability`, label: "Ver minha agenda" }
    : { href: `${appUrl}/mentors`, label: "Encontrar um mentor" };
  const body = role === "mentor"
    ? `Você agora aparece como mentor(a) da ${orgName} e pode receber pedidos de mentoria vindos dos beneficiários dela.`
    : `A organização agora acompanha sua jornada na Menvo e pode te conectar a mentores dedicados a ela.`;
  return `
    <h2>Você agora faz parte da ${orgName}</h2>
    <p>Olá, ${firstName}! Sua participação na <strong>${orgName}</strong> foi aprovada.</p>
    <div class="button-container">
        <a href="${cta.href}" class="button">${cta.label}</a>
    </div>
    <p>${body}</p>
  `;
}

export async function sendOrgMembershipApproved(data: {
  name: string;
  email: string;
  orgName: string;
  recipientRole: OrgRecipientRole;
}): Promise<{ success: boolean; error?: string }> {
  const firstName = escapeHtml(data.name.split(" ")[0] || data.name);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.menvo.com.br";
  return await sendEmail(
    data.email,
    `Bem-vindo(a) à ${data.orgName} na Menvo`,
    getEmailLayout("Participação aprovada", orgMembershipApprovedContent(firstName, escapeHtml(data.orgName), appUrl, data.recipientRole), { signatureType: "personal" })
  );
}

/**
 * Helper para envio via Brevo API
 */
async function sendEmail(
  to: string | string[],
  subject: string,
  htmlContent: string,
  cc?: string | string[]
): Promise<{ success: boolean; error?: string }> {
  const recipients = Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }];
  const ccRecipients = cc ? (Array.isArray(cc) ? cc.map(email => ({ email })) : [{ email: cc }]) : undefined;
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.warn("[EMAIL] BREVO_API_KEY não configurada.");
    return {
      success: false,
      error: "BREVO_API_KEY não configurada no ambiente."
    };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify({
        sender: {
          name: process.env.BREVO_SENDER_NAME || "Menvo",
          email: process.env.BREVO_SENDER_EMAIL || "contato@menvo.com.br"
        },
        to: recipients,
        ...(ccRecipients && { cc: ccRecipients }),
        subject,
        htmlContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[EMAIL] Erro Brevo:", errorData);
      return {
        success: false,
        error: errorData?.message || `Erro na API do Brevo (${response.status})`
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error("[EMAIL] Falha crítica:", error);
    return {
      success: false,
      error: error?.message || "Falha de conexão com os servidores do Brevo."
    };
  }
}

export function buildInactiveNoticeHtml(data: {
  name: string;
  deletionDate: string;
}): string {
  const firstName = escapeHtml(data.name.split(" ")[0] || data.name || "");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.menvo.com.br";
  const formattedDate = new Date(data.deletionDate).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  const content = `
    <h2>${firstName ? `Olá, ${firstName}` : "Olá"}!</h2>
    <p>Sua conta na Menvo está inativa há mais de 1 ano. Para proteger seus dados e seguir as melhores práticas de privacidade, contas sem uso prolongado são excluídas automaticamente.</p>
    <p>A exclusão está programada para o dia <strong>${formattedDate}</strong>.</p>
    <p>Se você ainda quiser usar a Menvo, basta clicar no botão abaixo e fazer login para reativar sua conta imediatamente.</p>
    <div class="button-container">
        <a href="${appUrl}/auth/login" class="button">Fazer Login e Manter Conta</a>
    </div>
    <p style="text-align: center; margin-top: -10px; margin-bottom: 20px;">
        <a href="${appUrl}/settings" style="color: ${COLORS.muted}; font-weight: 600; font-size: 14px; text-decoration: underline;">Pode apagar agora</a>
    </p>
  `;

  const footerExtra = `
    <p style="margin-top: 16px;">Você está recebendo este e-mail porque tem uma conta na Menvo. Para apagar seus dados antes da data, entre e use a opção de excluir conta em Configurações.</p>
  `;

  return getEmailLayout("Menvo", content, { signatureType: "personal", footerExtra });
}

export async function sendInactiveNotice(data: {
  name: string;
  email: string;
  deletionDate: string;
}): Promise<{ success: boolean; error?: string }> {
  const subject = "Aviso de inatividade: Sua conta será excluída em 30 dias";
  return await sendEmail(data.email, subject, buildInactiveNoticeHtml(data));
}

export function buildInactiveDeletionConfirmationHtml(data: { name: string }): string {
  const firstName = escapeHtml(data.name.split(" ")[0] || data.name || "");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.menvo.com.br";

  const content = `
    <h2>${firstName ? `Olá, ${firstName}` : "Olá"}!</h2>
    <p>Conforme avisamos há 30 dias, sua conta na Menvo foi excluída por inatividade (mais de 1 ano sem login).</p>
    <p>Removemos seu perfil e todos os arquivos enviados. Mantemos apenas um registro anônimo para auditoria e evitar novos envios.</p>
    <p>Esperamos te ver de novo no futuro! Você pode criar uma conta nova quando desejar.</p>
    <div class="button-container">
        <a href="${appUrl}/auth/register" class="button">Criar uma conta nova</a>
    </div>
  `;

  return getEmailLayout("Menvo", content, { signatureType: "personal" });
}

export async function sendInactiveDeletionConfirmation(data: {
  name: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  return await sendEmail(data.email, "Seus dados foram apagados por inatividade", buildInactiveDeletionConfirmationHtml(data));
}

/**
 * Envia um e-mail de teste real via Brevo baseado no template selecionado
 */
export async function sendTestEmail(params: {
  to: string;
  templateKey: string;
}): Promise<{ success: boolean; error?: string }> {
  const html = getEmailTemplatePreviewHtml(params.templateKey);

  const subjects: Record<string, string> = {
    confirmation: "[TESTE] Sessão de Mentoria Confirmada",
    verification: "[TESTE] Seu perfil de Mentor foi Aprovado",
    feedback: "[TESTE] Como foi sua mentoria? Seu feedback faz a diferença",
    cancellation: "[TESTE] Mentoria Cancelada",
    reminder: "[TESTE] Lembrete: Sua mentoria é hoje",
    retention_notice_30d: "[TESTE] Sua conta na Menvo será apagada em 30 dias",
    retention_notice_1d: "[TESTE] Último aviso: sua conta na Menvo será apagada amanhã",
    retention_deletion_confirmation: "[TESTE] Seus dados foram apagados da Menvo",
    inactive_notice_30d: "[TESTE] Aviso de inatividade: Sua conta será excluída em 30 dias",
    inactive_deletion_confirmation: "[TESTE] Seus dados foram apagados por inatividade",
    quiz_results: "[TESTE] Sua análise de carreira está pronta"
  };

  const subject = subjects[params.templateKey] || `[TESTE] Template Menvo: ${params.templateKey}`;
  return await sendEmail(params.to, subject, html);
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
        <div class="info-box">
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
        <div class="info-box">
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
        <div class="info-box">
            <div class="info-item"><strong>Data e Hora Original:</strong> 12/09/2026 às 16:00</div>
            <div class="info-item"><strong>Cancelado por:</strong> Juliana Ramos</div>
            <div class="info-item"><strong>Motivo informado:</strong><br/><em>"Conflito de agenda imprevisto no trabalho. Peço desculpas pelo transtorno."</em></div>
        </div>
        <div class="button-container">
            <a href="https://www.menvo.com.br/mentors" class="button">Explorar outros mentores</a>
        </div>
        <p style="font-size: 13px; color: ${COLORS.muted};">Imprevistos acontecem. Você pode encontrar novos horários e outros mentores disponíveis quando desejar.</p>
      `;
      return getEmailLayout("Mentoria Cancelada", content, { signatureType: "none" });
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
      return getEmailLayout("Lembrete de Mentoria", content, { signatureType: "none" });
    }
    case 'org_invite':
      return getEmailLayout("Convite de organização", orgInviteContent("Mariana", "Instituto Gira", "https://www.menvo.com.br", "mentee"), { signatureType: "none" });
    case 'org_invite_mentor':
      return getEmailLayout("Convite de organização (mentor)", orgInviteContent("Rodrigo", "Instituto Gira", "https://www.menvo.com.br", "mentor"), { signatureType: "none" });
    case 'org_join_request':
      return getEmailLayout("Nova solicitação", orgJoinRequestContent("Mariana Silva", "mariana@example.com", "Instituto Gira", "https://www.menvo.com.br", "mentee"), { signatureType: "none" });
    case 'org_membership_approved':
      return getEmailLayout("Participação aprovada", orgMembershipApprovedContent("Mariana", "Instituto Gira", "https://www.menvo.com.br", "mentee"), { signatureType: "personal" });
    case 'org_membership_approved_mentor':
      return getEmailLayout("Participação aprovada (mentor)", orgMembershipApprovedContent("Rodrigo", "Instituto Gira", "https://www.menvo.com.br", "mentor"), { signatureType: "personal" });
    case 'reengagement_invite':
      return buildReengagementInviteHtml({
        name: "Mariana",
        bodyText: "Olá, {{primeiro_nome}}!\n\nTenho uma novidade. Você preencheu o formulário do Estágio Recife, e agora criamos a Menvo como uma extensão dele.\n\nVocê não precisa saber quem pode te ajudar, você só precisa saber o que quer conversar.\n\nUm abraço,\nPaul",
        inviteUrl: "https://www.menvo.com.br/convite/preview-token"
      });
    case 'retention_notice_30d':
      return buildRetentionNoticeHtml({
        name: "Mariana",
        inviteUrl: "https://www.menvo.com.br/convite/preview-token",
        deletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        daysLeft: 30
      });
    case 'retention_notice_1d':
      return buildRetentionNoticeHtml({
        name: "Mariana",
        inviteUrl: "https://www.menvo.com.br/convite/preview-token",
        deletionDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        daysLeft: 1
      });
    case 'retention_deletion_confirmation':
      return buildRetentionDeletionConfirmationHtml({ name: "Mariana" });
    case 'inactive_notice_30d':
      return buildInactiveNoticeHtml({
        name: "Mariana",
        deletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    case 'inactive_deletion_confirmation':
      return buildInactiveDeletionConfirmationHtml({ name: "Mariana" });
    case 'quiz_results':
      return buildQuizResultsEmailHtml({
        name: "Mariana Silva",
        title: "Rota prática para o primeiro estágio em tecnologia",
        summary: "Mariana, suas respostas mostram clareza sobre onde você quer chegar: um estágio em desenvolvimento front-end. O que falta agora é transformar estudo em provas concretas do que você sabe fazer - um portfólio pequeno e candidaturas bem direcionadas.",
        resultUrl: "https://www.menvo.com.br/quiz/results/preview"
      });
    default:
      return getEmailLayout("Preview Menvo", "<p>Selecione um template para visualizar.</p>", { signatureType: "personal" });
  }
}

// =============================================
// Mentor → Mentee Contact Email
// =============================================

interface MentorContactEmailData {
  menteeEmail: string;
  menteeName: string;
  mentorEmail: string;
  mentorName: string;
  mentorJobTitle?: string;
  mentorCompany?: string;
  mentorBio?: string;
  mentorExpertise: string[];
  mentorSlug: string;
  mentorLinkedin?: string;
  mentorAvatarUrl?: string;
  customMessage?: string;
}

/**
 * Sends a notification email to a mentee informing them that a mentor
 * wants to connect. Includes the mentor's profile card so the mentee
 * can decide whether to reach out.
 */
export async function sendMentorContactEmail(data: MentorContactEmailData) {
  const expertiseBadges = data.mentorExpertise.slice(0, 5).map(e =>
    `<span style="display:inline-block;background:${COLORS.primary}15;color:${COLORS.primary};padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;margin:2px 4px 2px 0;">${escapeHtml(e)}</span>`
  ).join('');

  const mentorProfileUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.menvo.com.br'}/mentors/${data.mentorSlug}`;

  const content = `
    <p>Alguém viu seu perfil e quer se conectar com você.</p>
    
    ${data.customMessage ? `
    <p>Olha a mensagem:</p>
    <div style="background:#f8fafc;padding:24px 28px;margin:24px 0;border-radius:12px;border:1px solid ${COLORS.divider};">
      <p style="margin:0;line-height:1.7;font-size:16px;font-style:italic;color:#374151;">"${escapeHtml(data.customMessage).replace(/\n/g, '<br>')}"</p>
    </div>
    ` : ''}

    <div style="background:#f8fafc;border-radius:16px;padding:24px;margin:24px 0;border:1px solid ${COLORS.divider};">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width:100%;">
        <tr>
          ${data.mentorAvatarUrl ? `<td style="width:72px;vertical-align:top;padding-right:16px;">
            <img src="${data.mentorAvatarUrl}" alt="${escapeHtml(data.mentorName)}" width="64" height="64" style="border-radius:50%;display:block;object-fit:cover;width:64px;height:64px;border:3px solid ${COLORS.primary};" />
          </td>` : ''}
          <td style="vertical-align:top;">
            <p style="font-weight:800;color:#111827;font-size:18px;margin:0 0 4px 0;">${escapeHtml(data.mentorName)}</p>
            ${data.mentorJobTitle ? `<p style="font-size:14px;color:${COLORS.primary};font-weight:600;margin:0 0 2px 0;">${escapeHtml(data.mentorJobTitle)}${data.mentorCompany ? ` @ ${escapeHtml(data.mentorCompany)}` : ''}</p>` : ''}
            ${data.mentorBio ? `<p style="font-size:13px;color:${COLORS.muted};margin:8px 0 0 0;font-style:italic;line-height:1.5;">"${escapeHtml(data.mentorBio.slice(0, 140))}${data.mentorBio.length > 140 ? '...' : ''}"</p>` : ''}
          </td>
        </tr>
      </table>
      ${expertiseBadges ? `<div style="margin-top:16px;">${expertiseBadges}</div>` : ''}
    </div>

    <div class="button-container">
      <a href="${mentorProfileUrl}" class="button">Ver Perfil</a>
    </div>

    <div class="divider"></div>
    <p><strong>Dica:</strong> Responda logo! Mentores voluntários têm agenda concorrida e a disposição de ajudar pode não durar para sempre.</p>
  `;

  // Mensagem enviada por um terceiro (o mentor): a pessoa precisa saber por que
  // recebeu e como parar. Responder a este e-mail chega a contato@ - ver
  // PRIVACY_CONTACT; o opt-out é respeitado em app/api/community/contact.
  const footerExtra = `
    <p style="margin-top: 16px;">Você recebeu este e-mail porque tem um perfil na Menvo e um mentor da plataforma quis falar com você.
      Se não quiser receber esse tipo de contato, escreva para
      <a href="mailto:${PRIVACY_CONTACT}?subject=Parar%20de%20receber%20contatos" style="color: ${COLORS.muted}; text-decoration: underline;">${PRIVACY_CONTACT}</a>.
    </p>
  `;

  const subject = `${data.mentorName} quer ajudar você.`;
  return await sendEmail(data.menteeEmail, subject, getEmailLayout(escapeHtml(subject), content, { signatureType: "team", footerExtra }), data.mentorEmail);
}
