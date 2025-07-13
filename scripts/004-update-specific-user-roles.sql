-- =================================================================
-- MENVO - SCRIPT DE ATUALIZAÇÃO DE ROLES DE USUÁRIOS ESPECÍFICOS
-- Este script define roles específicas para usuários existentes.
-- Execute APÓS o 001-initial-schema.sql e 003-migrate-existing-auth-users-to-profiles.sql
-- =================================================================

DO $$
DECLARE
    paul_id UUID;
    mccartney_id UUID;
BEGIN
    -- Obter o ID do usuário paulmspessoa@gmail.com
    SELECT id INTO paul_id FROM auth.users WHERE email = 'paulmspessoa@gmail.com';

    -- Se o usuário existir, atualize a role para 'admin'
    IF paul_id IS NOT NULL THEN
        UPDATE public.profiles
        SET
            user_role = 'admin'::user_role,
            updated_at = NOW()
        WHERE id = paul_id;
        RAISE NOTICE 'Usuário paulmspessoa@gmail.com atualizado para admin.';
    ELSE
        RAISE NOTICE 'Usuário paulmspessoa@gmail.com não encontrado em auth.users. Certifique-se de que a conta foi criada.';
    END IF;

    -- Obter o ID do usuário mccartney.shalmo@gmail.com
    SELECT id INTO mccartney_id FROM auth.users WHERE email = 'mccartney.shalmo@gmail.com';

    -- Se o usuário existir, atualize a role para 'volunteer'
    IF mccartney_id IS NOT NULL THEN
        UPDATE public.profiles
        SET
            user_role = 'volunteer'::user_role,
            updated_at = NOW()
        WHERE id = mccartney_id;
        RAISE NOTICE 'Usuário mccartney.shalmo@gmail.com atualizado para volunteer.';
    ELSE
        RAISE NOTICE 'Usuário mccartney.shalmo@gmail.com não encontrado em auth.users. Certifique-se de que a conta foi criada.';
    END IF;

END $$;
