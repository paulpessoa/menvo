# Guia de Configuração para Produção - Google Calendar

## Resumo das Opções

### Opção 1: Variáveis de Ambiente Estáticas (Simples)
- ✅ Fácil de configurar
- ❌ Um token para toda a aplicação
- ❌ Se expirar, precisa renovar manualmente
- ❌ Não escalável para múltiplos usuários

### Opção 2: Tokens no Supabase (Recomendado)
- ✅ Token por usuário
- ✅ Renovação automática
- ✅ Escalável
- ✅ Mais seguro

## Configuração Recomendada (Opção 2)

### 1. Configurar Supabase

Execute no SQL Editor do Supabase:

\`\`\`sql
-- Criar tabela para tokens
CREATE TABLE google_calendar_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view own calendar tokens" ON google_calendar_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar tokens" ON google_calendar_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar tokens" ON google_calendar_tokens
    FOR UPDATE USING (auth.uid() = user_id);

-- Função para salvar tokens
CREATE OR REPLACE FUNCTION save_google_calendar_tokens(
    p_user_id UUID,
    p_access_token TEXT,
    p_refresh_token TEXT,
    p_expires_in INTEGER,
    p_scope TEXT DEFAULT 'https://www.googleapis.com/auth/calendar'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO google_calendar_tokens (
        user_id, access_token, refresh_token, expires_at, scope
    ) VALUES (
        p_user_id, p_access_token, p_refresh_token,
        NOW() + (p_expires_in || ' seconds')::INTERVAL, p_scope
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at,
        scope = EXCLUDED.scope,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter tokens
CREATE OR REPLACE FUNCTION get_google_calendar_tokens(p_user_id UUID)
RETURNS TABLE(
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_expired BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gct.access_token, gct.refresh_token, gct.expires_at,
        (gct.expires_at < NOW()) as is_expired
    FROM google_calendar_tokens gct
    WHERE gct.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
\`\`\`

### 2. Configurar Vercel

No dashboard da Vercel, adicione apenas estas variáveis:

\`\`\`
GOOGLE_CALENDAR_CLIENT_ID=your_google_calendar_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=your_google_calendar_client_secret
GOOGLE_CALENDAR_REDIRECT_URI=https://seu-dominio.vercel.app/api/auth/google-calendar/callback
\`\`\`

**Importante:** Configure essas variáveis diretamente na Vercel. O `GOOGLE_CALENDAR_REFRESH_TOKEN` não é mais necessário pois os tokens são salvos no Supabase por usuário.

### 3. Atualizar Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Vá para "APIs & Services" > "Credentials"
3. Edite suas credenciais OAuth 2.0
4. Adicione o URI de produção: `https://seu-dominio.vercel.app/api/auth/google-calendar/callback`

### 4. Fluxo de Uso

1. **Usuário conecta Google Calendar:**
   - Acessa `/test/calendar` ou qualquer página com botão de conexão
   - Clica em "Autorizar Google Calendar"
   - Completa o fluxo OAuth
   - Tokens são salvos automaticamente no Supabase

2. **Aplicação usa Google Calendar:**
   - Chama `createUserGoogleCalendarClient(userId)`
   - Função busca tokens do usuário no Supabase
   - Se expirado, renova automaticamente
   - Retorna cliente configurado

### 5. Endpoints Disponíveis

- `GET /api/calendar/status` - Verifica se usuário tem Google Calendar conectado
- `POST /api/calendar/test` - Cria evento de teste (requer autenticação)
- `GET /api/auth/google-calendar/authorize` - Gera URL de autorização
- `GET /api/auth/google-calendar/callback` - Processa callback do Google

### 6. Vantagens desta Abordagem

- ✅ **Segurança:** Tokens criptografados no Supabase
- ✅ **Escalabilidade:** Cada usuário tem seus próprios tokens
- ✅ **Renovação automática:** Tokens são renovados automaticamente
- ✅ **Auditoria:** Logs de quando tokens foram criados/atualizados
- ✅ **Flexibilidade:** Usuários podem desconectar individualmente

### 7. Monitoramento

Para monitorar o uso:

\`\`\`sql
-- Ver usuários com Google Calendar conectado
SELECT 
    u.email,
    gct.created_at as connected_at,
    gct.expires_at,
    (gct.expires_at < NOW()) as is_expired
FROM google_calendar_tokens gct
JOIN auth.users u ON u.id = gct.user_id
ORDER BY gct.created_at DESC;

-- Contar conexões ativas
SELECT COUNT(*) as active_connections
FROM google_calendar_tokens
WHERE expires_at > NOW();
\`\`\`

## Migração de Desenvolvimento para Produção

1. **Configure o Supabase** (SQL acima)
2. **Atualize as variáveis da Vercel** (sem refresh_token)
3. **Atualize o Google Cloud Console** (adicionar domínio de produção)
4. **Teste o fluxo completo** em produção
5. **Monitore os logs** para verificar se está funcionando

Esta abordagem é muito mais robusta e adequada para produção!
