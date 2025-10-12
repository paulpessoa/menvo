-- Tabela para armazenar sugestões de temas e áreas de mentoria
-- Nota: Para indicação de pessoas específicas, criar tabela separada no futuro (mentor_nominations)
CREATE TABLE IF NOT EXISTS mentor_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_text TEXT NOT NULL,
  linkedin_url TEXT, -- Mantido para compatibilidade, mas não usado no formulário atual
  knowledge_topics TEXT[], -- Array de tópicos de conhecimento selecionados
  free_topics TEXT[], -- Array de temas livres adicionados pelo usuário
  inclusion_tags TEXT[], -- Tags inclusivas relacionadas
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'contacted')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Índices para melhorar performance
CREATE INDEX idx_mentor_suggestions_user_id ON mentor_suggestions(user_id);
CREATE INDEX idx_mentor_suggestions_status ON mentor_suggestions(status);
CREATE INDEX idx_mentor_suggestions_created_at ON mentor_suggestions(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_mentor_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mentor_suggestions_updated_at
  BEFORE UPDATE ON mentor_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_mentor_suggestions_updated_at();

-- RLS Policies
ALTER TABLE mentor_suggestions ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver suas próprias sugestões
CREATE POLICY "Users can view their own suggestions"
  ON mentor_suggestions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem criar suas próprias sugestões
CREATE POLICY "Users can create their own suggestions"
  ON mentor_suggestions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias sugestões (apenas se status = 'pending')
CREATE POLICY "Users can update their own pending suggestions"
  ON mentor_suggestions
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Admins podem ver todas as sugestões
CREATE POLICY "Admins can view all suggestions"
  ON mentor_suggestions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Admins podem atualizar qualquer sugestão
CREATE POLICY "Admins can update all suggestions"
  ON mentor_suggestions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- View para facilitar consultas com informações do usuário
CREATE OR REPLACE VIEW mentor_suggestions_view AS
SELECT 
  ms.id,
  ms.user_id,
  ms.suggestion_text,
  ms.linkedin_url,
  ms.knowledge_topics,
  ms.free_topics,
  ms.inclusion_tags,
  ms.status,
  ms.admin_notes,
  ms.created_at,
  ms.updated_at,
  ms.reviewed_at,
  ms.reviewed_by,
  p.first_name,
  p.last_name,
  p.email,
  p.avatar_url,
  reviewer.first_name as reviewer_first_name,
  reviewer.last_name as reviewer_last_name
FROM mentor_suggestions ms
LEFT JOIN profiles p ON ms.user_id = p.id
LEFT JOIN profiles reviewer ON ms.reviewed_by = reviewer.id;

-- Grant permissions na view
GRANT SELECT ON mentor_suggestions_view TO authenticated;

-- Comentários na tabela
COMMENT ON TABLE mentor_suggestions IS 'Armazena sugestões de novos temas e áreas de mentoria feitas pelos usuários';
COMMENT ON COLUMN mentor_suggestions.suggestion_text IS 'Descrição/observação da sugestão de tema ou área de conhecimento';
COMMENT ON COLUMN mentor_suggestions.linkedin_url IS 'Campo mantido para compatibilidade, não usado no formulário atual';
COMMENT ON COLUMN mentor_suggestions.knowledge_topics IS 'Array de tópicos de conhecimento selecionados da lista existente';
COMMENT ON COLUMN mentor_suggestions.free_topics IS 'Array de temas livres adicionados pelo usuário (insights para expandir a lista)';
COMMENT ON COLUMN mentor_suggestions.inclusion_tags IS 'Tags inclusivas relacionadas à sugestão';
COMMENT ON COLUMN mentor_suggestions.status IS 'Status da sugestão: pending, reviewing, approved, rejected, contacted';
