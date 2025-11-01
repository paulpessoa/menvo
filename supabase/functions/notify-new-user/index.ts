// Edge Function para notificar admin sobre novos usuários via Brevo
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY")
const BREVO_SENDER_EMAIL =
  Deno.env.get("BREVO_SENDER_EMAIL") || "noreply@menvo.com.br"
const BREVO_SENDER_NAME = Deno.env.get("BREVO_SENDER_NAME") || "MENVO"
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "contato@menvo.com.br"

interface WebhookPayload {
  type: "INSERT"
  table: string
  record: {
    user_id: string
    role_id: string
    created_at: string
  }
  schema: string
}

serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json()

    console.log("📨 Webhook recebido:", payload)

    if (!BREVO_API_KEY) {
      throw new Error("Brevo API key not configured")
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Buscar informações do usuário
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", payload.record.user_id)
      .single()

    if (profileError) {
      console.error("Erro ao buscar perfil:", profileError)
      throw profileError
    }

    // Buscar nome do papel (role)
    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("name")
      .eq("id", payload.record.role_id)
      .single()

    if (roleError) {
      console.error("Erro ao buscar role:", roleError)
      throw roleError
    }

    const userName =
      `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
      "Usuário"
    const userEmail = profile.email
    const roleName = role.name === "mentor" ? "Mentor" : "Mentorado"
    const roleEmoji = role.name === "mentor" ? "👨‍🏫" : "👨‍🎓"

    // Enviar email via Brevo
    const emailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: {
          name: BREVO_SENDER_NAME,
          email: BREVO_SENDER_EMAIL
        },
        to: [
          {
            email: ADMIN_EMAIL,
            name: "Admin MENVO"
          }
        ],
        subject: `${roleEmoji} Novo ${roleName} cadastrado na plataforma!`,
        htmlContent: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .header {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 30px;
                  border-radius: 10px 10px 0 0;
                  text-align: center;
                }
                .content {
                  background: #f9fafb;
                  padding: 30px;
                  border-radius: 0 0 10px 10px;
                }
                .info-box {
                  background: white;
                  padding: 20px;
                  border-radius: 8px;
                  margin: 20px 0;
                  border-left: 4px solid #667eea;
                }
                .info-row {
                  display: flex;
                  justify-content: space-between;
                  padding: 10px 0;
                  border-bottom: 1px solid #e5e7eb;
                }
                .info-row:last-child {
                  border-bottom: none;
                }
                .label {
                  font-weight: 600;
                  color: #6b7280;
                }
                .value {
                  color: #111827;
                }
                .button {
                  display: inline-block;
                  background: #667eea;
                  color: white;
                  padding: 12px 30px;
                  text-decoration: none;
                  border-radius: 6px;
                  margin-top: 20px;
                }
                .footer {
                  text-align: center;
                  margin-top: 30px;
                  color: #6b7280;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>${roleEmoji} Novo ${roleName} Cadastrado!</h1>
              </div>
              <div class="content">
                <p>Olá Admin,</p>
                <p>Um novo usuário acabou de se cadastrar na plataforma MENVO e selecionou o papel de <strong>${roleName}</strong>!</p>
                
                <div class="info-box">
                  <div class="info-row">
                    <span class="label">Nome:</span>
                    <span class="value">${userName}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Email:</span>
                    <span class="value">${userEmail}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Papel:</span>
                    <span class="value">${roleEmoji} ${roleName}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Data:</span>
                    <span class="value">${new Date().toLocaleString("pt-BR", {
                      timeZone: "America/Sao_Paulo"
                    })}</span>
                  </div>
                </div>

                <p>
                  ${
                    role.name === "mentor"
                      ? "🎯 Este usuário está se oferecendo para ser mentor! Considere verificar o perfil dele em breve."
                      : "🎓 Este usuário está buscando mentoria! Certifique-se de que há mentores disponíveis na plataforma."
                  }
                </p>

                <center>
                  <a href="https://menvo.com.br/admin/users" class="button">
                    Ver no Dashboard Admin
                  </a>
                </center>

                <div class="footer">
                  <p>Esta é uma notificação automática do sistema MENVO</p>
                  <p>© ${new Date().getFullYear()} MENVO - Mentores Voluntários</p>
                </div>
              </div>
            </body>
          </html>
        `
      })
    })

    if (!emailResponse.ok) {
      const error = await emailResponse.text()
      console.error("Erro ao enviar email via Brevo:", error)
      console.error("Brevo status:", emailResponse.status)
      throw new Error(
        `Erro ao enviar email via Brevo: ${emailResponse.status} - ${error}`
      )
    }

    const emailData = await emailResponse.json()
    console.log("✅ Email enviado com sucesso via Brevo:", emailData)

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notificação enviada com sucesso",
        messageId: emailData.messageId
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200
      }
    )
  } catch (error) {
    console.error("❌ Erro na função:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500
      }
    )
  }
})
