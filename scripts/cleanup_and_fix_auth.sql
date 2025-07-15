-- ===================================================================
-- SCRIPT DE CONFIGURAÇÃO COMPLETO E IDEMPOTENTE PARA O BANCO DE DADOS
-- V.2.1 - Corrige erro de sintaxe `TIMESTAMPTZ WITH TIME ZONE`
-- ===================================================================

BEGIN;

-- Habilitar a extensão pgcrypto se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. DEFINIÇÃO DE TIPOS (ENUMS)
-- Garante que os tipos ENUM existam antes de usá-los.
DO $$ BEGIN CREATE TYPE public.user_role AS ENUM ('pending', 'mentee', 'mentor', 'admin', 'volunteer', 'moderator'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.user_status AS ENUM ('pending', 'active', 'suspended', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.session_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.volunteer_activity_status AS ENUM ('pending', 'validated', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.notification_type AS ENUM ('info', 'success', 'warning', 'error'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.notification_category AS ENUM ('system', 'mentorship', 'verification', 'volunteer'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.availability_status AS ENUM ('available', 'busy', 'unavailable'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. CRIAÇÃO E ATUALIZAÇÃO DE TABELAS
-- Usa `CREATE TABLE IF NOT EXISTS` e `ALTER TABLE` para robustez.

-- Tabela `profiles`
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
-- Adiciona colunas à tabela `profiles` se não existirem
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personal_website_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS portfolio_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS presentation_video_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_position TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_company TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS latitude REAL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longitude REAL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role public.user_role DEFAULT 'pending'::public.user_role NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status public.user_status DEFAULT 'pending'::public.user_status NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status public.verification_status DEFAULT 'pending'::public.verification_status NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_notes TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expertise_areas TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS topics TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS inclusion_tags TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS languages TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mentorship_approach TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS what_to_expect TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ideal_mentee TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cv_url TEXT;

-- Tabela `mentor_profiles`
CREATE TABLE IF NOT EXISTS public.mentor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    availability public.availability_status DEFAULT 'available'::public.availability_status,
    hourly_rate NUMERIC(10, 2),
    languages TEXT[],
    timezone TEXT,
    meeting_preferences JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tabela `mentorship_sessions`
CREATE TABLE IF NOT EXISTS public.mentorship_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    mentee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status public.session_status DEFAULT 'pending'::public.session_status,
    meeting_url TEXT,
    notes TEXT,
    feedback_mentor TEXT,
    feedback_mentee TEXT,
    rating_mentor INTEGER CHECK (rating_mentor BETWEEN 1 AND 5),
    rating_mentee INTEGER CHECK (rating_mentee BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tabela `volunteer_activities`
CREATE TABLE IF NOT EXISTS public.volunteer_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    description TEXT,
    hours NUMERIC(5, 2) NOT NULL CHECK (hours > 0),
    date DATE NOT NULL,
    location TEXT,
    organization TEXT,
    evidence_url TEXT,
    status public.volunteer_activity_status DEFAULT 'pending'::public.volunteer_activity_status,
    validated_by UUID REFERENCES public.profiles(id),
    validated_at TIMESTAMPTZ,
    validation_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tabela `notifications`
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
-- Adiciona colunas à tabela `notifications` se não existirem (CORREÇÃO DO ERRO)
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type public.notification_type DEFAULT 'info'::public.notification_type NOT NULL;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS category public.notification_category DEFAULT 'system'::public.notification_category NOT NULL;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS data JSONB;


-- 3. FUNÇÕES E TRIGGERS DO BANCO DE DADOS

-- Função para manter `updated_at` atualizado
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers para `updated_at`
DROP TRIGGER IF EXISTS on_update_profiles ON public.profiles;
CREATE TRIGGER on_update_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
-- (Adicione triggers para outras tabelas se necessário)

-- Função para criar um perfil quando um novo usuário se registra em `auth.users`
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para `handle_new_user`
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. POLÍTICAS DE SEGURANÇA (RLS)

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para `profiles`
DROP POLICY IF EXISTS "Public can view basic profile info." ON public.profiles;
CREATE POLICY "Public can view basic profile info." ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins can manage all profiles." ON public.profiles;
CREATE POLICY "Admins can manage all profiles." ON public.profiles FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Políticas para `volunteer_activities`
DROP POLICY IF EXISTS "Users can manage their own volunteer activities." ON public.volunteer_activities;
CREATE POLICY "Users can manage their own volunteer activities." ON public.volunteer_activities FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins/Moderators can manage all volunteer activities." ON public.volunteer_activities;
CREATE POLICY "Admins/Moderators can manage all volunteer activities." ON public.volunteer_activities FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'moderator'));

-- (Adicione políticas para outras tabelas conforme necessário)

-- 5. CONFIGURAÇÃO DO STORAGE

-- Criar bucket para fotos de perfil
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-photos', 'profile-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso para o bucket `profile-photos`
DROP POLICY IF EXISTS "Public can view profile photos." ON storage.objects;
CREATE POLICY "Public can view profile photos." ON storage.objects FOR SELECT USING (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "Authenticated users can upload profile photos." ON storage.objects;
CREATE POLICY "Authenticated users can upload profile photos." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-photos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own profile photo." ON storage.objects;
CREATE POLICY "Users can update their own profile photo." ON storage.objects FOR UPDATE USING (auth.uid() = owner) WITH CHECK (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "Users can delete their own profile photo." ON storage.objects;
CREATE POLICY "Users can delete their own profile photo." ON storage.objects FOR DELETE USING (auth.uid() = owner AND bucket_id = 'profile-photos');

-- 6. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON public.notifications(user_id, read);

COMMIT;
