const fs = require('fs');
const path = require('path');

const locales = ['pt-BR', 'en', 'es', 'da', 'fr', 'sv'];
const messagesDir = 'messages';

const onboardingKeys = {
  "pt-BR": {
    "title": "Escolha seu perfil",
    "description": "Selecione como você gostaria de participar da nossa plataforma. Você poderá alterar isso depois nas configurações.",
    "configuringFor": "Configurando perfil para:",
    "mentee": {
      "title": "Mentorado",
      "description": "Busco orientação e acompanhamento para crescer profissionalmente",
      "benefits": [
        "Acesso a mentores experientes",
        "Sessões de mentoria personalizadas",
        "Networking profissional",
        "Desenvolvimento de carreira"
      ],
      "success": "Perfil Mentorado selecionado com sucesso!"
    },
    "mentor": {
      "title": "Mentor",
      "description": "Quero compartilhar conhecimento e ajudar outros profissionais",
      "benefits": [
        "Compartilhar experiência",
        "Impactar carreiras",
        "Expandir rede de contatos",
        "Desenvolver habilidades de liderança"
      ],
      "success": "Perfil Mentor selecionado com sucesso!"
    },
    "saving": "Salvando seu perfil...",
    "confirm": "Confirmar Seleção",
    "error": {
      "notAuthenticated": "Usuário não autenticado",
      "sessionExpired": "Sessão expirada. Faça login novamente.",
      "saveError": "Erro ao salvar perfil. Verifique sua conexão.",
      "selectRequired": "Por favor, selecione um perfil"
    }
  },
  "en": {
    "title": "Choose your profile",
    "description": "Select how you would like to participate in our platform. You can change this later in settings.",
    "configuringFor": "Configuring profile for:",
    "mentee": {
      "title": "Mentee",
      "description": "I seek guidance and support to grow professionally",
      "benefits": [
        "Access to experienced mentors",
        "Personalized mentorship sessions",
        "Professional networking",
        "Career development"
      ],
      "success": "Mentee profile successfully selected!"
    },
    "mentor": {
      "title": "Mentor",
      "description": "I want to share knowledge and help other professionals",
      "benefits": [
        "Share experience",
        "Impact careers",
        "Expand networking",
        "Develop leadership skills"
      ],
      "success": "Mentor profile successfully selected!"
    },
    "saving": "Saving your profile...",
    "confirm": "Confirm Selection",
    "error": {
      "notAuthenticated": "User not authenticated",
      "sessionExpired": "Session expired. Please log in again.",
      "saveError": "Error saving profile. Check your connection.",
      "selectRequired": "Please select a profile"
    }
  }
};

const authExtraKeys = {
  "pt-BR": {
    "confirmed": {
      "title": "Email Confirmado!",
      "description": "Sua conta foi ativada com sucesso. Bem-vindo ao Menvo!",
      "redirecting": "Redirecionando automaticamente em {count} segundos...",
      "continueNow": "Continuar Agora",
      "help": "Precisa de ajuda? Entre em contato conosco.",
      "messages": {
        "role": "Você será redirecionado para selecionar seu tipo de conta",
        "profile": "Você será redirecionado para completar seu perfil",
        "dashboard": "Você será redirecionado para o dashboard"
      }
    },
    "forgotPassword": {
      "title": "Esqueceu a senha?",
      "description": "Insira seu e-mail e enviaremos um link para redefinir sua senha.",
      "sendLink": "Enviar Link de Recuperação",
      "backToLogin": "Voltar para o Login",
      "success": "Link enviado! Verifique seu e-mail."
    }
  },
  "en": {
    "confirmed": {
      "title": "Email Confirmed!",
      "description": "Your account has been successfully activated. Welcome to Menvo!",
      "redirecting": "Automatically redirecting in {count} seconds...",
      "continueNow": "Continue Now",
      "help": "Need help? Contact us.",
      "messages": {
        "role": "You will be redirected to select your account type",
        "profile": "You will be redirected to complete your profile",
        "dashboard": "You will be redirected to the dashboard"
      }
    },
    "forgotPassword": {
      "title": "Forgot Password?",
      "description": "Enter your email and we'll send you a link to reset your password.",
      "sendLink": "Send Recovery Link",
      "backToLogin": "Back to Login",
      "success": "Link sent! Check your email."
    }
  }
};

locales.forEach(locale => {
  const filePath = path.join(messagesDir, `${locale}.json`);
  if (fs.existsSync(filePath)) {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    content.onboarding = onboardingKeys[locale] || onboardingKeys['en'];
    content.auth = authExtraKeys[locale] || authExtraKeys['en'];
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Updated onboarding/auth keys for ${locale}`);
  }
});
