-- Padroniza os nomes das feature flags para o formato _flag
-- Conforme solicitado pelo Staff Engineer

BEGIN;

-- 1. Limpar flags antigas (opcional, para evitar confusão)
DELETE FROM public.feature_flags 
WHERE name IN (
    'waiting_list_enabled', 'waitingListEnabled',
    'new_mentorship_ux', 'newMentorshipUx',
    'feedback_enabled', 'feedbackEnabled',
    'maintenance_mode', 'maintenanceMode',
    'new_user_registration', 'newUserRegistration'
);

-- 2. Cadastrar as novas flags padronizadas
INSERT INTO public.feature_flags (name, enabled, description)
VALUES 
    ('waiting_list_flag', false, 'Habilita fila de espera no cadastro'),
    ('new_mentorship_flag', false, 'Habilita nova interface de mentoria'),
    ('feedback_app_flag', false, 'Habilita o balão flutuante de feedback'),
    ('maintenance_mode_flag', false, 'Bloqueia o site para manutenção (exceto admins)')
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description;

COMMIT;
