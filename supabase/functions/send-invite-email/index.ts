import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email } = await req.json()

    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: 'Name and email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const brevoApiKey = Deno.env.get('BREVO_API_KEY')
    const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL') || 'contato@menvo.com.br'
    const senderName = Deno.env.get('BREVO_SENDER_NAME') || 'MENVO'
    const siteUrl = Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'https://menvo.com.br'

    if (!brevoApiKey) {
      throw new Error('Brevo API key not configured')
    }

    const firstName = name.split(' ')[0]

    const emailHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao MENVO</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                🎉 Obrigado por participar!
              </h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                RecnPlay 2025 × MENVO
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151;">
                Olá, <strong>${firstName}</strong>! 👋
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151; line-height: 1.6;">
                Obrigado por responder nosso questionário no RecnPlay! Sua participação é muito importante para construirmos uma plataforma de mentoria mais forte e acessível.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 12px; padding: 30px;">
                <tr>
                  <td align="center">
                    <h2 style="margin: 0 0 15px 0; color: #ffffff; font-size: 24px;">
                      Conheça o MENVO
                    </h2>
                    <p style="margin: 0 0 25px 0; color: #dbeafe; font-size: 15px; line-height: 1.6;">
                      Uma iniciativa social que conecta jovens a mentores voluntários de diferentes áreas, criando pontes reais para o aprendizado e desenvolvimento profissional e pessoal.
                    </p>
                    <a href="${siteUrl}/auth/register" style="display: inline-block; background-color: #ffffff; color: #2563eb; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Cadastrar na Plataforma
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px;">
                💡 O que você pode fazer no MENVO:
              </h3>
              <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
                <li>Conectar-se com mentores voluntários</li>
                <li>Receber orientação profissional gratuita</li>
                <li>Participar de sessões de mentoria</li>
                <li>Compartilhar seu conhecimento como mentor</li>
                <li>Fazer parte de uma comunidade de crescimento</li>
              </ul>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 30px 40px 30px; text-align: center;">
              <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Juntos estamos construindo algo transformador. 💙
              </p>
              <a href="${siteUrl}" style="color: #667eea; text-decoration: none; font-size: 14px;">
                Visitar MENVO →
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                MENVO - Conectando pessoas, transformando futuros
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Você recebeu este email porque participou do RecnPlay 2025
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: email,
            name: name,
          },
        ],
        subject: '🎉 Obrigado por participar! Conheça o MENVO',
        htmlContent: emailHtml,
      }),
    })

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.text()
      console.error('Brevo API error:', errorData)
      console.error('Brevo status:', brevoResponse.status)
      throw new Error(`Failed to send email via Brevo: ${brevoResponse.status}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invite email sent successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending invite email:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to send invite email', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
