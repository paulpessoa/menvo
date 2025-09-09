-- Script para corrigir as políticas RLS da tabela volunteer_activities
-- Execute este script no Supabase SQL Editor após criar a tabela

-- Primeiro, remover políticas existentes se houver conflitos
DROP POLICY IF EXISTS "Users can insert own volunteer activities" ON volunteer_activities;
DROP POLICY IF EXISTS "Users can view own volunteer activities" ON volunteer_activities;
DROP POLICY IF EXISTS "Users can update own pending activities" ON volunteer_activities;
DROP POLICY IF EXISTS "Volunteers and admins can view all activities" ON volunteer_activities;
DROP POLICY IF EXISTS "Admins can validate activities" ON volunteer_activities;

-- Recriar políticas com a estrutura correta
-- 1. Usuários podem inserir suas próprias atividades
CREATE POLICY "Users can insert own volunteer activities" ON volunteer_activities
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- 2. Usuários podem ver suas próprias atividades
CREATE POLICY "Users can view own volunteer activities" ON volunteer_activities
    FOR SELECT 
    USING (auth.uid() = user_id);

-- 3. Usuários podem atualizar suas próprias atividades pendentes
CREATE POLICY "Users can update own pending activities" ON volunteer_activities
    FOR UPDATE 
    USING (auth.uid() = user_id AND status = 'pending');

-- 4. Voluntários e admins podem ver todas as atividades
CREATE POLICY "Volunteers and admins can view all activities" ON volunteer_activities
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND (p.user_role = 'admin' OR p.is_volunteer = true)
        )
    );

-- 5. Admins podem validar atividades (UPDATE para status, validated_by, etc.)
CREATE POLICY "Admins can validate activities" ON volunteer_activities
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND p.user_role = 'admin'
        )
    );

-- Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'volunteer_activities';

-- Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'volunteer_activities';
