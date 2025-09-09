-- =================================================================
-- USER MIGRATION SYSTEM
-- Sistema para migrar usuários da plataforma antiga
-- =================================================================

-- Tabela para armazenar dados de migração de usuários
CREATE TABLE IF NOT EXISTS user_migrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_user_id TEXT NOT NULL, -- ID do usuário na plataforma antiga
  new_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- ID na nova plataforma
  email TEXT NOT NULL,
  old_user_data JSONB NOT NULL, -- Dados completos do usuário antigo
  migration_status TEXT DEFAULT 'pending' CHECK (migration_status IN ('pending', 'completed', 'failed', 'conflict')),
  migration_notes TEXT,
  conflict_reason TEXT, -- Razão do conflito se houver
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  migrated_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  UNIQUE(old_user_id),
  UNIQUE(email, migration_status) -- Evita duplicatas de email pendentes
);

-- Tabela para logs de auditoria da migração
CREATE TABLE IF NOT EXISTS migration_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_id UUID REFERENCES user_migrations(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'created', 'updated', 'completed', 'failed', 'conflict_resolved'
  details JSONB,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_migrations_email ON user_migrations(email);
CREATE INDEX IF NOT EXISTS idx_user_migrations_status ON user_migrations(migration_status);
CREATE INDEX IF NOT EXISTS idx_user_migrations_old_id ON user_migrations(old_user_id);
CREATE INDEX IF NOT EXISTS idx_migration_audit_logs_migration_id ON migration_audit_logs(migration_id);
CREATE INDEX IF NOT EXISTS idx_migration_audit_logs_action ON migration_audit_logs(action);

-- Enable RLS
ALTER TABLE user_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Apenas admins podem acessar dados de migração
CREATE POLICY "Only admins can access user migrations" ON user_migrations
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name = 'admin'
    )
  );

CREATE POLICY "Only admins can access migration audit logs" ON migration_audit_logs
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name = 'admin'
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_user_migrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_migrations_updated_at
  BEFORE UPDATE ON user_migrations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_migrations_updated_at();

-- Função para criar log de auditoria automaticamente
CREATE OR REPLACE FUNCTION create_migration_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  -- Log para INSERT
  IF TG_OP = 'INSERT' THEN
    INSERT INTO migration_audit_logs (migration_id, action, details, performed_by)
    VALUES (NEW.id, 'created', jsonb_build_object(
      'email', NEW.email,
      'old_user_id', NEW.old_user_id,
      'status', NEW.migration_status
    ), auth.uid());
    RETURN NEW;
  END IF;
  
  -- Log para UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Se status mudou
    IF OLD.migration_status != NEW.migration_status THEN
      INSERT INTO migration_audit_logs (migration_id, action, details, performed_by)
      VALUES (NEW.id, NEW.migration_status, jsonb_build_object(
        'old_status', OLD.migration_status,
        'new_status', NEW.migration_status,
        'notes', NEW.migration_notes
      ), auth.uid());
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_migrations_audit_log
  AFTER INSERT OR UPDATE ON user_migrations
  FOR EACH ROW
  EXECUTE FUNCTION create_migration_audit_log();
