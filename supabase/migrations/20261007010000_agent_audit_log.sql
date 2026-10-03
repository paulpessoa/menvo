-- Camada 14: auditoria de escritas feitas por agentes (assistente, MCP, server).
-- Guarda quem, por qual superfície, qual capability e se deu erro. De propósito
-- NÃO guarda o input (pode conter texto livre do usuário): dado mínimo (LGPD).
-- actor_id vira NULL se a conta for apagada, preservando o registro de auditoria.
create table if not exists public.agent_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  surface text not null check (surface in ('mcp', 'assistant', 'server')),
  capability text not null,
  effect text not null check (effect in ('write', 'destructive')),
  outcome text not null check (outcome in ('ok', 'error')),
  created_at timestamptz not null default now()
);

alter table public.agent_audit_log enable row level security;

-- O ator só registra eventos dele mesmo (o handler roda com o client do usuário).
create policy "Actors insert own agent audit rows"
  on public.agent_audit_log for insert to authenticated
  with check (actor_id = (select auth.uid()));

-- Leitura só para admin; is_admin() é security definer (sem recursão de RLS).
create policy "Admins read agent audit log"
  on public.agent_audit_log for select to authenticated
  using (public.is_admin());

create index if not exists idx_agent_audit_log_actor_created
  on public.agent_audit_log (actor_id, created_at desc);
create index if not exists idx_agent_audit_log_capability_created
  on public.agent_audit_log (capability, created_at desc);
