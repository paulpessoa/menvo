/**
 * Brevo Email Service
 * Serviço simplificado para envio de emails via Brevo (SMTP)
 */

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
}

/**
 * Envia email de solicitação de agendamento ao mentor
 */
export async function sendAppointmentRequest(
  data: AppointmentRequestData
): Promise<void> {
  const { mentorEmail, mentorName, menteeName, scheduledAt, message, token } = data;

  // URL de confirmação
  const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/appointments/confirm?token=${token}`;

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
            <p><strong>📅 Data e Hora:</strong> ${new Date(scheduledAt).toLocaleString('pt-BR')}</p>
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
  `;

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY || '',
      },
      body: JSON.stringify({
        sender: {
          name: process.env.BREVO_SENDER_NAME || 'Menvo',
          email: process.env.BREVO_SENDER_EMAIL || 'noreply@menvo.com.br',
        },
        to: [
          {
            email: mentorEmail,
            name: mentorName,
          },
        ],
        subject: `Nova solicitação de mentoria de ${menteeName}`,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[EMAIL] Erro ao enviar email de agendamento:', error);
      throw new Error(`Falha ao enviar email: ${response.status}`);
    }

    console.log('[EMAIL] Email de agendamento enviado com sucesso para:', mentorEmail);
  } catch (error) {
    console.error('[EMAIL] Erro ao enviar email:', error);
    throw error;
  }
}

/**
 * Envia email de confirmação de agendamento para mentor e mentee
 */
export async function sendAppointmentConfirmation(
  data: AppointmentConfirmationData
): Promise<void> {
  const { mentorEmail, menteeEmail, mentorName, menteeName, scheduledAt, meetLink } = data;

  // Formatar data
  const formattedDate = new Date(scheduledAt).toLocaleString('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  // Template HTML com link do Meet
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
        .info { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; font-weight: bold; }
        .meet-link { background-color: #EEF2FF; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #4F46E5; }
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
          
          ${meetLink ? `
          <div class="meet-link">
            <p><strong>🎥 Link da Reunião:</strong></p>
            <p style="margin: 10px 0;">
              <a href="${meetLink}" class="button">Entrar no Google Meet</a>
            </p>
            <p style="font-size: 12px; color: #666; word-break: break-all;">
              Ou copie e cole este link: ${meetLink}
            </p>
          </div>
          ` : `
          <div class="meet-link">
            <p><strong>📧 Convite do Google Calendar:</strong></p>
            <p>Você também receberá um convite do Google Calendar com o link da reunião.</p>
          </div>
          `}
          
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
  `;

  try {
    // Enviar para ambos (mentor e mentee)
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY || '',
      },
      body: JSON.stringify({
        sender: {
          name: process.env.BREVO_SENDER_NAME || 'Menvo',
          email: process.env.BREVO_SENDER_EMAIL || 'noreply@menvo.com.br',
        },
        to: [
          {
            email: mentorEmail,
            name: mentorName,
          },
          {
            email: menteeEmail,
            name: menteeName,
          },
        ],
        subject: 'Mentoria confirmada!',
        htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[EMAIL] Erro ao enviar email de confirmação:', error);
      throw new Error(`Falha ao enviar email: ${response.status}`);
    }

    console.log('[EMAIL] Email de confirmação enviado com sucesso');
  } catch (error) {
    console.error('[EMAIL] Erro ao enviar email:', error);
    throw error;
  }
}
