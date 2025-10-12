-- Funções auxiliares para administração de sugestões de mentores

-- Função para obter estatísticas de sugestões
CREATE OR REPLACE FUNCTION get_mentor_suggestions_stats()
RETURNS TABLE (
  total_suggestions BIGINT,
  pending_count BIGINT,
  reviewing_count BIGINT,
  approved_count BIGINT,
  rejected_count BIGINT,
  contacted_count BIGINT,
  avg_response_time_hours NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_suggestions,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_count,
    COUNT(*) FILTER (WHERE status = 'reviewing')::BIGINT as reviewing_count,
    COUNT(*) FILTER (WHERE status = 'approved')::BIGINT as approved_count,
    COUNT(*) FILTER (WHERE status = 'rejected')::BIGINT as rejected_count,
    COUNT(*) FILTER (WHERE status = 'contacted')::BIGINT as contacted_count,
    AVG(
      EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 3600
    ) FILTER (WHERE reviewed_at IS NOT NULL) as avg_response_time_hours
  FROM mentor_suggestions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter tópicos de conhecimento mais sugeridos
CREATE OR REPLACE FUNCTION get_most_suggested_knowledge_topics(limit_count INT DEFAULT 10)
RETURNS TABLE (
  topic TEXT,
  suggestion_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    unnest(knowledge_topics) as topic,
    COUNT(*)::BIGINT as suggestion_count
  FROM mentor_suggestions
  WHERE knowledge_topics IS NOT NULL AND array_length(knowledge_topics, 1) > 0
  GROUP BY unnest(knowledge_topics)
  ORDER BY suggestion_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter temas livres mais sugeridos
CREATE OR REPLACE FUNCTION get_most_suggested_free_topics(limit_count INT DEFAULT 10)
RETURNS TABLE (
  topic TEXT,
  suggestion_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    unnest(free_topics) as topic,
    COUNT(*)::BIGINT as suggestion_count
  FROM mentor_suggestions
  WHERE free_topics IS NOT NULL AND array_length(free_topics, 1) > 0
  GROUP BY unnest(free_topics)
  ORDER BY suggestion_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter tags inclusivas mais sugeridas
CREATE OR REPLACE FUNCTION get_most_suggested_inclusion_tags(limit_count INT DEFAULT 10)
RETURNS TABLE (
  tag TEXT,
  suggestion_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    unnest(inclusion_tags) as tag,
    COUNT(*)::BIGINT as suggestion_count
  FROM mentor_suggestions
  WHERE inclusion_tags IS NOT NULL AND array_length(inclusion_tags, 1) > 0
  GROUP BY unnest(inclusion_tags)
  ORDER BY suggestion_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter usuários mais ativos em sugestões
CREATE OR REPLACE FUNCTION get_most_active_suggesters(limit_count INT DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  suggestion_count BIGINT,
  approved_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ms.user_id,
    p.first_name,
    p.last_name,
    p.email,
    COUNT(*)::BIGINT as suggestion_count,
    COUNT(*) FILTER (WHERE ms.status = 'approved')::BIGINT as approved_count
  FROM mentor_suggestions ms
  LEFT JOIN profiles p ON ms.user_id = p.id
  GROUP BY ms.user_id, p.first_name, p.last_name, p.email
  ORDER BY suggestion_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar sugestões antigas como expiradas (opcional)
CREATE OR REPLACE FUNCTION mark_old_suggestions_as_expired(days_old INT DEFAULT 90)
RETURNS INT AS $$
DECLARE
  updated_count INT;
BEGIN
  UPDATE mentor_suggestions
  SET 
    status = 'rejected',
    admin_notes = COALESCE(admin_notes || E'\n\n', '') || 'Sugestão expirada automaticamente após ' || days_old || ' dias sem revisão.',
    reviewed_at = NOW()
  WHERE 
    status = 'pending'
    AND created_at < NOW() - (days_old || ' days')::INTERVAL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions para funções (apenas admins)
REVOKE ALL ON FUNCTION get_mentor_suggestions_stats() FROM PUBLIC;
REVOKE ALL ON FUNCTION get_most_suggested_knowledge_topics(INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_most_suggested_free_topics(INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_most_suggested_inclusion_tags(INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_most_active_suggesters(INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION mark_old_suggestions_as_expired(INT) FROM PUBLIC;

-- Comentários nas funções
COMMENT ON FUNCTION get_mentor_suggestions_stats() IS 'Retorna estatísticas gerais sobre sugestões de mentores';
COMMENT ON FUNCTION get_most_suggested_knowledge_topics(INT) IS 'Retorna os tópicos de conhecimento mais sugeridos';
COMMENT ON FUNCTION get_most_suggested_free_topics(INT) IS 'Retorna os temas livres mais sugeridos pelos usuários';
COMMENT ON FUNCTION get_most_suggested_inclusion_tags(INT) IS 'Retorna as tags inclusivas mais sugeridas';
COMMENT ON FUNCTION get_most_active_suggesters(INT) IS 'Retorna os usuários que mais fazem sugestões';
COMMENT ON FUNCTION mark_old_suggestions_as_expired(INT) IS 'Marca sugestões antigas como expiradas automaticamente';
