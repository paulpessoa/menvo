-- Primeiro, vamos garantir que a tabela profiles existe com a estrutura correta
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Criar tabela profiles com estrutura completa
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
            THEN first_name || ' ' || last_name
            WHEN first_name IS NOT NULL 
            THEN first_name
            WHEN last_name IS NOT NULL 
            THEN last_name
            ELSE NULL
        END
    ) STORED,
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    role TEXT DEFAULT 'pending' CHECK (role IN ('pending', 'mentee', 'mentor', 'admin', 'volunteer', 'moderator')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver próprio perfil" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar próprio perfil" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Perfis públicos são visíveis" ON public.profiles
    FOR SELECT USING (status = 'active');

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Migrar usuários existentes se houver
INSERT INTO public.profiles (id, email, first_name, last_name)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'first_name', ''),
    COALESCE(raw_user_meta_data->>'last_name', '')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
