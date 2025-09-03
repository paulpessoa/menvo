# Armazenamento de Tokens do Google Calendar no Supabase

## 1. Criar Tabela para Tokens

Execute no SQL Editor do Supabase:

```sql
-- Tabela para armazenar tokens do Google Calendar por usuário
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

-- RLS (Row Level Security)
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver seus próprios tokens
CREATE POLICY "Users can view own calendar tokens" ON google_calendar_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar tokens" ON google_calendar_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar tokens" ON google_calendar_tokens
    FOR UPDATE USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_google_calendar_tokens_updated_at
    BEFORE UPDATE ON google_calendar_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 2. Funções para Gerenciar Tokens

```sql
-- Função para salvar/atualizar tokens
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
        user_id,
        access_token,
        refresh_token,
        expires_at,
        scope
    ) VALUES (
        p_user_id,
        p_access_token,
        p_refresh_token,
        NOW() + (p_expires_in || ' seconds')::INTERVAL,
        p_scope
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

-- Função para obter tokens válidos
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
        gct.access_token,
        gct.refresh_token,
        gct.expires_at,
        (gct.expires_at < NOW()) as is_expired
    FROM google_calendar_tokens gct
    WHERE gct.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```