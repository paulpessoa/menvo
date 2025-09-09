-- Script para verificar e criar tabelas de volunteer activities
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela volunteer_activities existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'volunteer_activities'
) as table_exists;

-- 2. Verificar se a coluna is_volunteer existe na tabela profiles
SELECT EXISTS (
   SELECT FROM information_schema.columns 
   WHERE table_schema = 'public'
   AND table_name = 'profiles'
   AND column_name = 'is_volunteer'
) as column_exists;

-- 3. Se a tabela não existir, criar ela
DO $$
BEGIN
    -- Adicionar coluna is_volunteer se não existir
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'is_volunteer'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_volunteer BOOLEAN DEFAULT FALSE;
        CREATE INDEX IF NOT EXISTS idx_profiles_is_volunteer ON profiles(is_volunteer);
    END IF;

    -- Criar tabela volunteer_activities se não existir
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'volunteer_activities'
    ) THEN
        CREATE TABLE volunteer_activities (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            activity_type TEXT NOT NULL CHECK (activity_type IN (
                'mentoria', 'workshop', 'palestra', 'codigo', 'design', 
                'marketing', 'administracao', 'suporte', 'traducao', 'outro'
            )),
            description TEXT,
            hours DECIMAL(4,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
            date DATE NOT NULL,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected')),
            validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            validated_at TIMESTAMP WITH TIME ZONE,
            validation_notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Criar índices
        CREATE INDEX idx_volunteer_activities_user_id ON volunteer_activities(user_id);
        CREATE INDEX idx_volunteer_activities_status ON volunteer_activities(status);
        CREATE INDEX idx_volunteer_activities_date ON volunteer_activities(date DESC);
        CREATE INDEX idx_volunteer_activities_type ON volunteer_activities(activity_type);

        -- Habilitar RLS
        ALTER TABLE volunteer_activities ENABLE ROW LEVEL SECURITY;

        -- Políticas RLS
        -- Usuários podem inserir suas próprias atividades
        CREATE POLICY "Users can insert own volunteer activities" ON volunteer_activities
            FOR INSERT 
            WITH CHECK (auth.uid() = user_id);

        -- Usuários podem ver suas próprias atividades
        CREATE POLICY "Users can view own volunteer activities" ON volunteer_activities
            FOR SELECT 
            USING (auth.uid() = user_id);

        -- Usuários podem atualizar suas próprias atividades pendentes
        CREATE POLICY "Users can update own pending activities" ON volunteer_activities
            FOR UPDATE 
            USING (auth.uid() = user_id AND status = 'pending');

        -- Admins e voluntários podem ver todas as atividades
        CREATE POLICY "Volunteers and admins can view all activities" ON volunteer_activities
            FOR SELECT 
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles p
                    WHERE p.id = auth.uid() 
                    AND (p.user_role = 'admin' OR p.is_volunteer = true)
                )
            );

        -- Admins podem validar atividades
        CREATE POLICY "Admins can validate activities" ON volunteer_activities
            FOR UPDATE 
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles p
                    WHERE p.id = auth.uid() 
                    AND p.user_role = 'admin'
                )
            );

        -- Trigger para updated_at
        CREATE OR REPLACE FUNCTION update_volunteer_activities_updated_at()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;

        CREATE TRIGGER volunteer_activities_updated_at
            BEFORE UPDATE ON volunteer_activities
            FOR EACH ROW
            EXECUTE FUNCTION update_volunteer_activities_updated_at();

        -- Atualizar mentores existentes para serem voluntários
        UPDATE profiles 
        SET is_volunteer = true 
        WHERE user_role IN ('admin', 'mentor');

        RAISE NOTICE 'Tabela volunteer_activities criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela volunteer_activities já existe.';
    END IF;
END
$$;
