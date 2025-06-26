-- Configuração de Roles e Permissions para JWT do Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Tipos ENUM (crie só se não existir)
-- Remova/comente se já existe!
-- CREATE TYPE public.app_role AS ENUM ('admin', 'mentor', 'mentee', 'recruiter', 'company', 'moderator');
-- CREATE TYPE public.app_permission AS ENUM (
--   'users.read', 'users.write', 'users.delete',
--   'mentors.read', 'mentors.write', 'mentors.delete',
--   'sessions.read', 'sessions.write', 'sessions.delete',
--   'admin.actions', 'verifications.manage', 'reviews.manage',
--   'profiles.read', 'profiles.write'
-- );

-- 2. Ajuste da tabela roles
ALTER TABLE public.roles
  DROP COLUMN IF EXISTS role_type,
  DROP COLUMN IF EXISTS description,
  ADD COLUMN IF NOT EXISTS display_name text NOT NULL DEFAULT '',
  ALTER COLUMN name SET NOT NULL,
  ADD CONSTRAINT roles_name_unique UNIQUE (name);

-- 3. Ajuste da tabela permissions
ALTER TABLE public.permissions
  DROP COLUMN IF EXISTS permission_type,
  DROP COLUMN IF EXISTS display_name,
  ADD COLUMN IF NOT EXISTS display_name text NOT NULL DEFAULT '',
  ALTER COLUMN name SET NOT NULL,
  ADD CONSTRAINT permissions_name_unique UNIQUE (name);

-- 4. Ajuste da tabela role_permissions
-- (garanta que role_id e permission_id existem e são FK)
-- Se já está ok, pode pular.

-- 5. Popular roles
INSERT INTO public.roles (name, display_name)
VALUES
  ('admin', 'Administrador'),
  ('mentor', 'Mentor'),
  ('mentee', 'Mentorado'),
  ('recruiter', 'Recrutador'),
  ('company', 'Empresa'),
  ('moderator', 'Moderador')
ON CONFLICT (name) DO UPDATE SET display_name = EXCLUDED.display_name;

-- 6. Popular permissions
INSERT INTO public.permissions (name, display_name)
VALUES
  ('users.read', 'Ler usuários'),
  ('users.write', 'Editar usuários'),
  ('users.delete', 'Deletar usuários'),
  ('mentors.read', 'Ler mentores'),
  ('mentors.write', 'Editar mentores'),
  ('mentors.delete', 'Deletar mentores'),
  ('sessions.read', 'Ler sessões'),
  ('sessions.write', 'Editar sessões'),
  ('sessions.delete', 'Deletar sessões'),
  ('admin.actions', 'Ações administrativas'),
  ('verifications.manage', 'Gerenciar verificações'),
  ('reviews.manage', 'Gerenciar avaliações'),
  ('profiles.read', 'Ler perfis'),
  ('profiles.write', 'Editar perfis')
ON CONFLICT (name) DO UPDATE SET display_name = EXCLUDED.display_name;

-- 7. Associar permissions aos roles (exemplo, ajuste conforme sua regra de negócio)
-- Admin: todas as permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Mentor: permissões específicas
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'mentor'
  AND p.name IN ('profiles.read', 'profiles.write', 'sessions.read', 'sessions.write', 'reviews.manage')
ON CONFLICT DO NOTHING;

-- Mentee: permissões básicas
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'mentee'
  AND p.name IN ('profiles.read', 'profiles.write', 'mentors.read', 'sessions.read', 'sessions.write')
ON CONFLICT DO NOTHING;

-- Recruiter: permissões de busca e leitura
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'recruiter'
  AND p.name IN ('profiles.read', 'mentors.read', 'users.read')
ON CONFLICT DO NOTHING;

-- Company: permissões de leitura e gestão de perfis
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'company'
  AND p.name IN ('profiles.read', 'profiles.write', 'users.read')
ON CONFLICT DO NOTHING;

-- Moderator: permissões intermediárias
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'moderator'
  AND p.name IN ('users.read', 'users.write', 'mentors.read', 'mentors.write', 'sessions.read', 'sessions.write', 'reviews.manage', 'verifications.manage')
ON CONFLICT DO NOTHING;

-- 8. Função para retornar roles e permissions no JWT
CREATE OR REPLACE FUNCTION get_user_roles_and_permissions(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'roles', COALESCE(roles_array, '[]'::json),
    'permissions', COALESCE(permissions_array, '[]'::json)
  ) INTO result
  FROM (
    SELECT 
      json_agg(DISTINCT r.name) as roles_array,
      json_agg(DISTINCT p.name) as permissions_array
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    JOIN public.role_permissions rp ON r.id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_uuid AND ur.status = 'active'
  ) subquery;
  RETURN COALESCE(result, '{"roles": [], "permissions": []}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Função auth.jwt() para customizar o token
CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS JSON AS $$
DECLARE
  user_role public.app_role;
BEGIN
  -- Busca a role principal do usuário
  SELECT role INTO user_role FROM public.user_roles WHERE user_id = auth.uid();

  RETURN json_build_object(
    'sub', auth.uid(),
    'user_role', user_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Função para verificar se usuário tem uma permission específica
CREATE OR REPLACE FUNCTION has_permission(user_uuid UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    JOIN public.role_permissions rp ON r.id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_uuid 
      AND ur.status = 'active'
      AND p.name = permission_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Função para verificar se usuário tem um role específico
CREATE OR REPLACE FUNCTION has_role(user_uuid UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid 
      AND ur.status = 'active'
      AND r.name = role_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Trigger para atualizar JWT quando roles/permissions mudarem
CREATE OR REPLACE FUNCTION refresh_user_jwt()
RETURNS TRIGGER AS $$
BEGIN
  -- Forçar refresh do token (isso será feito no frontend)
  -- Por enquanto, apenas log da mudança
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    'role_update',
    'Permissões atualizadas',
    'Suas permissões foram atualizadas. Faça logout e login novamente para aplicar as mudanças.',
    json_build_object('updated_at', now())
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para atualizar JWT quando roles/permissions mudarem
DROP TRIGGER IF EXISTS trigger_refresh_jwt_on_role_change ON public.user_roles;
CREATE TRIGGER trigger_refresh_jwt_on_role_change
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION refresh_user_jwt();

-- 13. Função para atribuir role a um usuário
CREATE OR REPLACE FUNCTION assign_user_role(
  target_user_id UUID,
  role_name TEXT,
  assigned_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  role_id_var UUID;
BEGIN
  -- Verificar se o usuário que está atribuindo tem permissão
  IF assigned_by IS NOT NULL AND NOT has_permission(assigned_by, 'users.write') THEN
    RAISE EXCEPTION 'Usuário não tem permissão para atribuir roles';
  END IF;
  
  -- Obter ID do role
  SELECT id INTO role_id_var FROM public.roles WHERE name = role_name;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Role % não encontrado', role_name;
  END IF;
  
  -- Inserir ou atualizar user_role
  INSERT INTO public.user_roles (user_id, role_id, status)
  VALUES (target_user_id, role_id_var, 'active')
  ON CONFLICT (user_id, role_id) 
  DO UPDATE SET 
    status = 'active',
    updated_at = now();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Função para remover role de um usuário
CREATE OR REPLACE FUNCTION remove_user_role(
  target_user_id UUID,
  role_name TEXT,
  removed_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  role_id_var UUID;
BEGIN
  -- Verificar se o usuário que está removendo tem permissão
  IF removed_by IS NOT NULL AND NOT has_permission(removed_by, 'users.write') THEN
    RAISE EXCEPTION 'Usuário não tem permissão para remover roles';
  END IF;
  
  -- Obter ID do role
  SELECT id INTO role_id_var FROM public.roles WHERE name = role_name;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Role % não encontrado', role_name;
  END IF;
  
  -- Desativar user_role
  UPDATE public.user_roles 
  SET status = 'inactive', updated_at = now()
  WHERE user_id = target_user_id AND role_id = role_id_var;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. View para facilitar consultas de roles e permissions
CREATE OR REPLACE VIEW user_roles_permissions_view AS
SELECT 
  u.id as user_id,
  u.email,
  u.first_name,
  u.last_name,
  json_agg(DISTINCT r.name) as roles,
  json_agg(DISTINCT p.name) as permissions,
  json_agg(DISTINCT json_build_object(
    'role', r.name,
    'permissions', (
      SELECT json_agg(p2.name)
      FROM public.role_permissions rp2
      JOIN public.permissions p2 ON rp2.permission_id = p2.id
      WHERE rp2.role_id = r.id
    )
  )) as roles_with_permissions
FROM public.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id AND ur.status = 'active'
LEFT JOIN public.roles r ON ur.role_id = r.id
LEFT JOIN public.role_permissions rp ON r.id = rp.role_id
LEFT JOIN public.permissions p ON rp.permission_id = p.id
GROUP BY u.id, u.email, u.first_name, u.last_name;

-- 16. Políticas RLS para as tabelas de roles e permissions
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas para roles
CREATE POLICY "Roles are viewable by authenticated users" ON public.roles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Roles are manageable by admins" ON public.roles
  FOR ALL USING (has_permission(auth.uid(), 'admin.actions'));

-- Políticas para permissions
CREATE POLICY "Permissions are viewable by authenticated users" ON public.permissions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permissions are manageable by admins" ON public.permissions
  FOR ALL USING (has_permission(auth.uid(), 'admin.actions'));

-- Políticas para role_permissions
CREATE POLICY "Role permissions are viewable by authenticated users" ON public.role_permissions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Role permissions are manageable by admins" ON public.role_permissions
  FOR ALL USING (has_permission(auth.uid(), 'admin.actions'));

-- Políticas para user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all user roles" ON public.user_roles
  FOR ALL USING (has_permission(auth.uid(), 'users.write'));

-- 17. Comentários para documentação
COMMENT ON FUNCTION get_user_roles_and_permissions(UUID) IS 'Retorna roles e permissions de um usuário em formato JSON';
COMMENT ON FUNCTION has_permission(UUID, TEXT) IS 'Verifica se um usuário tem uma permission específica';
COMMENT ON FUNCTION has_role(UUID, TEXT) IS 'Verifica se um usuário tem um role específico';
COMMENT ON FUNCTION assign_user_role(UUID, TEXT, UUID) IS 'Atribui um role a um usuário';
COMMENT ON FUNCTION remove_user_role(UUID, TEXT, UUID) IS 'Remove um role de um usuário';
COMMENT ON VIEW user_roles_permissions_view IS 'View para consultar roles e permissions dos usuários'; 