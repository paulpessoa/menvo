-- Feature flag that hides the in-app chat across the app.
-- Disabled by default: contact between mentors and mentees happens on LinkedIn
-- until users ask for a built-in channel. Toggle from /dashboard/admin/feature-flags.
INSERT INTO feature_flags (name, description, enabled, tags)
SELECT
    'chat_flag',
    'Chat interno (menu Mensagens, /messages e botões de chat). Desligado: contato via LinkedIn.',
    false,
    ARRAY['chat']
WHERE NOT EXISTS (SELECT 1 FROM feature_flags WHERE name = 'chat_flag');
