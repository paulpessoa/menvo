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

/**
 * Escapa texto livre fornecido pelo usuário antes de interpolar em HTML de
 * e-mail. Necessário para qualquer campo de formulário longo (bio,
 * abordagem de mentoria etc.) — ao contrário de nome/e-mail, esses campos
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
        <div class="info-item"><strong>Nome:</strong> ${data.userName}</div>
        <div class="info-item"><strong>E-mail:</strong> ${data.userEmail}</div>
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
 * Pede que alguém da lista de espera entre em contato caso ainda tenha
 * interesse em participar da Menvo como mentor ou mentorado.
 */
export async function sendWaitingListContactRequest(data: {
  name: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const firstName = escapeHtml(data.name.split(" ")[0] || data.name);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.menvo.com.br";
  const content = `
    <h2>Você ainda tem interesse na Menvo?</h2>
    <p>Olá, ${firstName}! Vimos que você se cadastrou na nossa lista de espera há um tempo e queremos entender melhor como podemos te ajudar.</p>
    <p>Você tem interesse em participar da Menvo como:</p>
    <div class="info-box">
        <div class="info-item">🎓 <strong>Mentorado(a):</strong> buscando orientação de carreira, técnica ou de negócios</div>
        <div class="info-item">🤝 <strong>Mentor(a) voluntário(a):</strong> compartilhando sua experiência com quem está começando</div>
    </div>
    <p>Responda este e-mail nos contando qual dessas opções combina com você (ou as duas!) e o que você está buscando no momento. Assim conseguimos te ajudar a encontrar a pessoa certa o quanto antes.</p>
    <div class="button-container">
        <a href="${appUrl}/signup" class="button">Criar minha conta na Menvo</a>
    </div>
    <p>Ficamos no aguardo do seu retorno!</p>
  `;
  return await sendEmail(
    data.email,
    "Você ainda tem interesse na Menvo?",
    getEmailLayout("Continua com a gente?", content, { signatureType: "personal" })
  );
}

/**
 * Avisa alguém da lista de espera que já criamos uma conta na Menvo para
 * ela (como mentee, por padrão) e traz um link de convite com token —
 * ao clicar, a pessoa já entra autenticada e só precisa definir uma senha.
 */
export async function sendWaitingListAccountInvite(data: {
  name: string;
  email: string;
  inviteLink: string;
}): Promise<{ success: boolean; error?: string }> {
  const firstName = escapeHtml(data.name.split(" ")[0] || data.name);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.menvo.com.br";
  const content = `
    <h2>Sua conta na Menvo já está pronta!</h2>
    <p>Olá, ${firstName}! Vimos seu interesse na nossa lista de espera e já criamos uma conta para você começar — sem precisar preencher cadastro do zero.</p>
    <p>Falta só um passo: defina sua senha de acesso clicando no botão abaixo.</p>
    <div class="button-container">
        <a href="${data.inviteLink}" class="button">Definir minha senha e entrar</a>
    </div>
    <p>Depois de entrar, complete seu perfil (ou faça nosso <a href="${appUrl}/quiz" style="color: ${COLORS.primary}; font-weight: 600;">Quiz de Carreira</a> de 2 minutos) para que possamos te ajudar a encontrar a mentoria certa — inclusive com sugestões feitas manualmente pela nossa equipe.</p>
    <p style="font-size: 13px; color: ${COLORS.muted};">Por segurança, este link expira em algumas horas. Se ele não funcionar mais, é só solicitar um novo em "Esqueceu a senha?" na tela de login usando este mesmo e-mail.</p>
  `;
  return await sendEmail(
    data.email,
    "Sua conta na Menvo já está pronta — falta só a senha",
    getEmailLayout("Bem-vindo(a) à Menvo!", content, { signatureType: "personal" })
  );
}

/**
 * Pede que alguém complete o perfil (ou faça o quiz de carreira) porque
 * ainda não descrevemos o que essa pessoa busca — sem isso não dá para
 * sugerir ou fazer um match, manual ou automático.
 */
export async function sendWaitingListCompleteProfileRequest(data: {
  name: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const firstName = escapeHtml(data.name.split(" ")[0] || data.name);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.menvo.com.br";
  const content = `
    <h2>Nos conte o que você está buscando</h2>
    <p>Olá, ${firstName}! Para te ajudarmos a encontrar a mentoria certa, precisamos entender melhor seus objetivos — e ainda não temos essa informação sobre você.</p>
    <p>Escolha uma das opções abaixo (leva menos de 2 minutos):</p>
    <div class="button-container">
        <a href="${appUrl}/quiz" class="button">Fazer o Quiz de Carreira</a>
    </div>
    <p style="text-align: center; margin-top: -10px; margin-bottom: 20px;">
        <a href="${appUrl}/profile" style="color: ${COLORS.primary}; font-weight: 600; font-size: 14px; text-decoration: underline;">Ou completar meu perfil diretamente</a>
    </p>
    <p>Com essa informação, nossa equipe consegue sugerir os mentores mais alinhados com o seu momento — e, se preferir, também podemos fazer essa conexão manualmente.</p>
  `;
  return await sendEmail(
    data.email,
    "Nos conte o que você busca na Menvo",
    getEmailLayout("O que você está buscando?", content, { signatureType: "personal" })
  );
}

// ---------------------------------------------------------------------------
// Convites de reengajamento (base histórica importada, ex.: JotForm)
// ---------------------------------------------------------------------------

/**
 * Converte o corpo do e-mail escrito pelo admin (texto simples, com
 * `{{primeiro_nome}}` como placeholder) em HTML seguro: cada linha em
 * branco separa um parágrafo, e todo o texto passa por `escapeHtml` antes
 * de virar markup — o admin nunca escreve HTML diretamente aqui.
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
 * completar o perfil ou apoiar como mentor(a), e — obrigatório por LGPD —
 * dá uma saída fácil, sem login, para parar de receber e-mails ou apagar
 * os dados. `inviteUrl` já aponta para a página pública `/convite/[token]`;
 * esta função só decora os `?intent=` de cada ação (nunca executa nada
 * sozinha — ver docs/domains/reengagement-invites.md §3.2).
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.menvo.com.br";
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
      Leia nossa <a href="${appUrl}/privacy" style="color: ${COLORS.muted}; text-decoration: underline;">Política de Privacidade</a>.
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

// ---------------------------------------------------------------------------
// Organizações parceiras (multi-tenant)
// ---------------------------------------------------------------------------

type OrgRecipientRole = "mentor" | "mentee";

function orgInviteContent(firstName: string, orgName: string, appUrl: string, role: OrgRecipientRole) {
  const body = role === "mentor"
    ? `<p>A <strong>${orgName}</strong> é uma organização parceira da Menvo e quer contar com você como mentor(a) do grupo dela na plataforma.</p>
       <p>Ao aceitar, você aparece como mentor da ${orgName} e pode receber pedidos de mentoria vindos dos beneficiários dela — sua agenda e seu processo de aceite continuam exatamente os mesmos.</p>`
    : `<p>A <strong>${orgName}</strong> é uma organização parceira da Menvo e quer acompanhar sua jornada de mentoria na plataforma.</p>
       <p>Ao aceitar, a organização passa a ver seu progresso (sessões agendadas, quiz de carreira) para te apoiar melhor — sua conta continua exatamente a mesma.</p>`;
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
  htmlContent: string
): Promise<{ success: boolean; error?: string }> {
  const recipients = Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }];
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
    reminder: "[TESTE] Lembrete: Sua mentoria é hoje"
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
    default:
      return getEmailLayout("Preview Menvo", "<p>Selecione um template para visualizar.</p>", { signatureType: "personal" });
  }
}
