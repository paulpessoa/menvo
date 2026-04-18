-- Migration: Inicializar Storage para o Menvo Hub
-- Propósito: Criar o bucket public-assets e configurar as políticas de acesso

-- 1. Criar o bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-assets', 'public-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Permitir que qualquer pessoa veja os arquivos (Leitura Pública)
DROP POLICY IF EXISTS "Acesso Público aos Assets" ON storage.objects;
CREATE POLICY "Acesso Público aos Assets" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'public-assets');

-- 3. Permitir que usuários autenticados façam upload na pasta hub-resources
DROP POLICY IF EXISTS "Upload de Recursos Hub" ON storage.objects;
CREATE POLICY "Upload de Recursos Hub" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'public-assets' AND 
    (storage.foldername(name))[1] = 'hub-resources'
);

-- 4. Permitir que Admins gerenciem tudo no bucket
DROP POLICY IF EXISTS "Admins gerenciam assets" ON storage.objects;
CREATE POLICY "Admins gerenciam assets" ON storage.objects
FOR ALL TO authenticated
USING (
    bucket_id = 'public-assets' AND public.is_admin()
);
