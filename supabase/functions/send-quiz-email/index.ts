import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalysisResult {
  pontuacao: number
  titulo_personalizado: string
  resumo_motivador: string
  mentores_sugeridos: Array<{
    tipo: string
    razao: string
    disponivel: boolean
    mentor_nome?: string
  }>
  conselhos_praticos: string[]
  proximos_passos: string[]
  areas_desenvolvimento: string[]
  mensagem_final: string
  potencial_mentor?: boolean
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { responseId } = await req.json()

    if (!responseId) {
      return new Response(
        JSON.stringify({ error: 'Response ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get quiz response with analysis
    const { data: quizResponse, error: responseError } = await supabaseClient
      .from('quiz_responses')
      .select('*')
      .eq('id', responseId)
      .single()

    if (responseError || !quizResponse) {
      return new Response(
        JSON.stringify({ error: 'Quiz response not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!quizResponse.ai_analysis) {
      return new Response(
        JSON.stringify({ error: 'Analysis not yet processed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const analysis: AnalysisResult = quizResponse.ai_analysis
    const hasGift = quizResponse.score >= 700

    // Generate email HTML
    const emailHtml = generateEmailTemplate(
      quizResponse.name,
      quizResponse.score,
      analysis,
      hasGift,
      responseId
    )

    // Send email via Brevo
    const brevoApiKey = Deno.env.get('BREVO_API_KEY')
    const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL') || 'noreply@menvo.com.br'
    const senderName = Deno.env.get('BREVO_SENDER_NAME') || 'MENVO'

    if (!brevoApiKey) {
      throw new Error('Brevo API key not configured')
    }

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
            email: quizResponse.email,
            name: quizResponse.name,
          },
        ],
        subject: `🎯 Sua Análise de Potencial - ${quizResponse.score} pontos!`,
        htmlContent: emailHtml,
      }),
    })

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.text()
      console.error('Brevo API error:', errorData)
      throw new Error('Failed to send email via Brevo')
    }

    // Update email sent status
    const { error: updateError } = await supabaseClient
      .from('quiz_responses')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
      })
      .eq('id', responseId)

    if (updateError) {
      console.error('Error updating email status:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to send email', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateEmailTemplate(
  name: string,
  score: number,
  analysis: AnalysisResult,
  hasGift: boolean,
  responseId: string
): string {
  const firstName = name.split(' ')[0]
  const resultUrl = `${Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'https://menvo.com.br'}/quiz/results/${responseId}`

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sua Análise de Potencial - MENVO</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                🎯 Sua Análise Personalizada
              </h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                RecnPlay 2025 × MENVO
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151;">
                Olá, <strong>${firstName}</strong>! 👋
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151; line-height: 1.6;">
                Obrigado por participar do nosso questionário no RecnPlay! Aqui está sua análise personalizada gerada com inteligência artificial.
              </p>
            </td>
          </tr>

          <!-- Score Card -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px;">
                <tr>
                  <td align="center">
                    <div style="background-color: #ffffff; width: 120px; height: 120px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto;">
                      <div style="text-align: center;">
                        <div style="font-size: 48px; font-weight: bold; color: #667eea;">${score}</div>
                        <div style="font-size: 12px; color: #6b7280;">de 1000</div>
                      </div>
                    </div>
                    <h2 style="margin: 20px 0 10px 0; color: #ffffff; font-size: 24px;">
                      ${analysis.titulo_personalizado}
                    </h2>
                    <p style="margin: 0; color: #e0e7ff; font-size: 16px; line-height: 1.6;">
                      ${analysis.resumo_motivador}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${hasGift ? `
          <!-- Gift Section -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #d1fae5; border-radius: 12px; padding: 20px; border: 2px solid #10b981;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 10px 0; color: #065f46; font-size: 20px;">
                      🎉 Parabéns! Você ganhou um brinde!
                    </h3>
                    <p style="margin: 0; color: #047857; font-size: 14px;">
                      Sua pontuação foi acima de 700! Escolha entre <strong>caneta</strong> ou <strong>botton</strong> e retire no estande do MENVO no RecnPlay.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Mentors Section -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px;">
                👥 Mentores Sugeridos
              </h3>
              ${analysis.mentores_sugeridos.map(mentor => `
                <div style="background-color: #f9fafb; border-left: 4px solid ${mentor.disponivel ? '#3b82f6' : '#9ca3af'}; padding: 15px; margin-bottom: 10px; border-radius: 4px;">
                  <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                      <strong style="color: #1f2937; font-size: 16px;">${mentor.tipo}</strong>
                      ${mentor.mentor_nome ? `<div style="color: #6b7280; font-size: 14px; margin-top: 4px;">Mentor: ${mentor.mentor_nome}</div>` : ''}
                    </div>
                    <span style="background-color: ${mentor.disponivel ? '#dbeafe' : '#f3f4f6'}; color: ${mentor.disponivel ? '#1e40af' : '#6b7280'}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                      ${mentor.disponivel ? 'Disponível' : 'Em breve'}
                    </span>
                  </div>
                  <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                    ${mentor.razao}
                  </p>
                </div>
              `).join('')}
            </td>
          </tr>

          <!-- Practical Advice -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px;">
                💡 Conselhos Práticos
              </h3>
              ${analysis.conselhos_praticos.map(conselho => `
                <div style="display: flex; gap: 10px; margin-bottom: 12px;">
                  <span style="color: #10b981; font-size: 20px;">✓</span>
                  <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">
                    ${conselho}
                  </p>
                </div>
              `).join('')}
            </td>
          </tr>

          <!-- Next Steps -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px;">
                🎯 Próximos Passos
              </h3>
              ${analysis.proximos_passos.map((passo, index) => `
                <div style="display: flex; gap: 10px; margin-bottom: 12px;">
                  <span style="color: #667eea; font-weight: bold;">${index + 1}.</span>
                  <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">
                    ${passo}
                  </p>
                </div>
              `).join('')}
            </td>
          </tr>

          ${analysis.potencial_mentor ? `
          <!-- Potential Mentor -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ede9fe; border-radius: 12px; padding: 20px; border: 2px solid #8b5cf6;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 10px 0; color: #5b21b6; font-size: 18px;">
                      💜 Você tem potencial para ser mentor!
                    </h3>
                    <p style="margin: 0; color: #6b21a8; font-size: 14px; line-height: 1.6;">
                      Identificamos que você tem interesse em compartilhar conhecimento. Considere se cadastrar como mentor voluntário na plataforma MENVO e ajudar outras pessoas em sua jornada.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Final Message -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6; text-align: center; font-style: italic;">
                "${analysis.mensagem_final}"
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 30px 30px 30px;" align="center">
              <a href="${resultUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Ver Análise Completa
              </a>
              <p style="margin: 15px 0 0 0; font-size: 14px; color: #6b7280;">
                ou acesse: <a href="${resultUrl}" style="color: #667eea;">${resultUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Join MENVO -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 12px; padding: 30px;">
                <tr>
                  <td align="center">
                    <h3 style="margin: 0 0 10px 0; color: #ffffff; font-size: 22px;">
                      Junte-se ao MENVO
                    </h3>
                    <p style="margin: 0 0 20px 0; color: #dbeafe; font-size: 14px; line-height: 1.6;">
                      Uma iniciativa social que conecta jovens a mentores voluntários, criando pontes reais para o aprendizado e desenvolvimento profissional e pessoal.
                    </p>
                    <a href="https://menvo.com.br/auth/register" style="display: inline-block; background-color: #ffffff; color: #2563eb; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                      Cadastrar Agora
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                MENVO - Conectando pessoas, transformando futuros 💙
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Este email foi enviado porque você participou do questionário no RecnPlay 2025
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
}
