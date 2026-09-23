-- Feature flag gating the AI assistant (/assistant, diagnostic mode).
-- Already existed in production as a manual row (enabled=true); this
-- migration just brings it under version control so a fresh environment
-- (local dev, CI, disaster recovery) seeds the same state. Toggle from
-- /dashboard/admin/feature-flags.
INSERT INTO feature_flags (name, description, enabled, tags)
SELECT
    'ai_assistant_flag',
    'Assistente de IA (/assistant) e modo diagnóstico. Requer login.',
    true,
    ARRAY['ai']
WHERE NOT EXISTS (SELECT 1 FROM feature_flags WHERE name = 'ai_assistant_flag');
