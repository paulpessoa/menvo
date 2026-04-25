-- Cadastra a feature flag feedback_enabled no banco de dados
-- Esta flag controla a exibição do balão flutuante de feedback no frontend

-- Mapeamento:
-- Banco: feedback_enabled
-- Frontend: feedbackEnabled

INSERT INTO public.feature_flags (name, enabled, description)
VALUES (
    'feedback_enabled', 
    false, 
    'Habilita o balão flutuante de feedback para os usuários. Mude para true para mostrar o ícone no canto inferior direito.'
)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description;
