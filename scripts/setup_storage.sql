-- Configurar storage para fotos de perfil
BEGIN;

-- Criar bucket para fotos de perfil se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile-photos',
    'profile-photos',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas de acesso para o bucket profile-photos
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile photos" ON storage.objects;

-- Permitir visualização pública das fotos
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-photos');

-- Permitir upload de fotos para usuários autenticados
CREATE POLICY "Users can upload profile photos" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'profile-photos' 
    AND auth.role() = 'authenticated'
);

-- Permitir atualização das próprias fotos
CREATE POLICY "Users can update own profile photos" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
) WITH CHECK (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir exclusão das próprias fotos
CREATE POLICY "Users can delete own profile photos" ON storage.objects
FOR DELETE USING (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

COMMIT;

-- Verificar se o bucket foi criado
SELECT * FROM storage.buckets WHERE id = 'profile-photos';
