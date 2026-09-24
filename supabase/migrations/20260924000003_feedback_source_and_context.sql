-- Migration: Add source and context to feedback table
-- Plan: docs/AI_PLATFORM_PLAN.md §4.3 (Active Feedback) & §8 (Fase 2 item 4)
--
-- 1. Adds `source` ('assistant', 'diagnostic', 'session', 'platform') to classify feedback origins.
-- 2. Adds `context` jsonb for tracking associated session/diagnostic IDs and metadata.
-- 3. Ensures RLS policies allow authenticated users to submit their feedback safely.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'feedback' and column_name = 'source'
  ) then
    alter table public.feedback add column source text not null default 'platform';
    create index if not exists idx_feedback_source on public.feedback (source);
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'feedback' and column_name = 'context'
  ) then
    alter table public.feedback add column context jsonb not null default '{}'::jsonb;
  end if;
end $$;

-- Enable RLS if not already enabled
alter table public.feedback enable row level security;

-- Policies for public.feedback
drop policy if exists "Anyone can insert feedback" on public.feedback;
drop policy if exists "Users insert own feedback" on public.feedback;
drop policy if exists "Users read own feedback" on public.feedback;

create policy "Users insert own feedback"
  on public.feedback for insert to anon, authenticated
  with check (
    user_id is null or user_id = auth.uid()
  );

create policy "Users read own feedback"
  on public.feedback for select to authenticated
  using (
    user_id = auth.uid() or public.is_admin()
  );

revoke all on public.feedback from anon;
grant insert on public.feedback to anon;
grant select, insert on public.feedback to authenticated;
