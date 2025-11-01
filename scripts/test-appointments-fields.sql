-- Script de Teste para Validar Campos de Appointments
-- Execute este script após aplicar a migration para verificar se tudo está correto

-- 1. Verificar estrutura da tabela appointments
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'appointments'
    AND column_name IN ('notes_mentee', 'notes_mentor', 'cancellation_reason', 'cancelled_at', 'cancelled_by')
ORDER BY ordinal_position;

-- 2. Verificar comentários das colunas
SELECT 
    cols.column_name,
    pg_catalog.col_description(c.oid, cols.ordinal_position::int) as column_comment
FROM information_schema.columns cols
JOIN pg_catalog.pg_class c ON c.relname = cols.table_name
WHERE cols.table_schema = 'public' 
    AND cols.table_name = 'appointments'
    AND cols.column_name IN ('notes_mentee', 'notes_mentor')
ORDER BY cols.ordinal_position;

-- 3. Verificar se existem dados nos campos (sample)
SELECT 
    id,
    status,
    CASE 
        WHEN notes_mentee IS NOT NULL THEN 'HAS_MENTEE_NOTES'
        ELSE 'NO_MENTEE_NOTES'
    END as mentee_notes_status,
    CASE 
        WHEN notes_mentor IS NOT NULL THEN 'HAS_MENTOR_NOTES'
        ELSE 'NO_MENTOR_NOTES'
    END as mentor_notes_status,
    created_at
FROM public.appointments
ORDER BY created_at DESC
LIMIT 10;

-- 4. Contar appointments por status e presença de notas
SELECT 
    status,
    COUNT(*) as total,
    COUNT(notes_mentee) as with_mentee_notes,
    COUNT(notes_mentor) as with_mentor_notes
FROM public.appointments
GROUP BY status
ORDER BY status;

-- 5. Verificar se não existem mais as colunas antigas (deve dar erro se migration foi aplicada)
-- Descomente para testar:
-- SELECT comments, mentor_notes FROM public.appointments LIMIT 1;
-- Se der erro "column does not exist", a migration foi aplicada com sucesso!
