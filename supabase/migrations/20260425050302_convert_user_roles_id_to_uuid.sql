-- Converte o ID da tabela user_roles de Integer para UUID
-- Mantendo role_id como Integer (1, 2, 3)

BEGIN;

-- 1. Remover a restrição de chave primária atual
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_pkey;

-- 2. Renomear a coluna antiga para backup/limpeza
ALTER TABLE public.user_roles RENAME COLUMN id TO old_id;

-- 3. Adicionar a nova coluna ID como UUID
ALTER TABLE public.user_roles ADD COLUMN id UUID DEFAULT gen_random_uuid();

-- 4. Tornar a nova coluna a Chave Primária
ALTER TABLE public.user_roles ADD PRIMARY KEY (id);

-- 5. Remover a coluna antiga
ALTER TABLE public.user_roles DROP COLUMN old_id;

COMMIT;
