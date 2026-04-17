-- Migration: Criação da tabela hub_resources para o Menvo Hub
-- Propósito: Gerenciar eventos, cursos, ferramentas e indicações de afiliados

-- 1. Criar Enums se não existirem
DO $$ BEGIN
    CREATE TYPE hub_resource_type AS ENUM ('event', 'course', 'tool', 'discount', 'job');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE hub_resource_status AS ENUM ('pending', 'published', 'rejected', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Criar a Tabela
CREATE TABLE IF NOT EXISTS public.hub_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type hub_resource_type NOT NULL DEFAULT 'event',
    url TEXT NOT NULL,
    image_url TEXT,
    badge_text TEXT,
    is_affiliate BOOLEAN DEFAULT false,
    status hub_resource_status DEFAULT 'pending',
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE public.hub_resources ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de RLS (Remover se existirem para evitar erro de duplicata)
DROP POLICY IF EXISTS "Visualização pública de recursos publicados" ON public.hub_resources;
DROP POLICY IF EXISTS "Usuários logados podem sugerir recursos" ON public.hub_resources;
DROP POLICY IF EXISTS "Admins podem gerenciar tudo" ON public.hub_resources;

CREATE POLICY "Visualização pública de recursos publicados" 
ON public.hub_resources FOR SELECT 
USING (status = 'published');

CREATE POLICY "Usuários logados podem sugerir recursos" 
ON public.hub_resources FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins podem gerenciar tudo" 
ON public.hub_resources FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        JOIN roles ON user_roles.role_id = roles.id 
        WHERE user_roles.user_id = auth.uid() AND roles.name = 'admin'
    )
);

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_hub_resources_status ON public.hub_resources(status);
CREATE INDEX IF NOT EXISTS idx_hub_resources_type ON public.hub_resources(type);
