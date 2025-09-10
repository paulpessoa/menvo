const { google } = require("googleapis")
const readline = require("readline")

// Configuração OAuth2
const CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET
const REDIRECT_URI = process.env.GOOGLE_CALENDAR_REDIRECT_URI

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
)

const scopes = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events"
]

// Gerar URL de autorização
const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: scopes,
  prompt: "consent"
})

console.log("🔗 Acesse esta URL para autorizar a aplicação:")
console.log(authUrl)
console.log("")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.question("📋 Cole o código de autorização aqui: ", async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code)

    console.log("")
    console.log("✅ Tokens obtidos com sucesso!")
    console.log("")
    console.log("📋 COPIE ESTE REFRESH TOKEN PARA SEU .env.stage:")
    console.log(`GOOGLE_CALENDAR_REFRESH_TOKEN=${tokens.refresh_token}`)
    console.log("")

    if (tokens.access_token) {
      console.log("🔑 Access Token também obtido (válido por 1 hora)")
    }
  } catch (error) {
    console.error("❌ Erro ao obter tokens:", error.message)
  }

  rl.close()
})
