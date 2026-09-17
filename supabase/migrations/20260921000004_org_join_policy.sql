-- Phase 1.5 §6.1 (docs/MULTI_TENANT_ROADMAP.md): let an org choose whether
-- its /o/[slug] page accepts open requests or invite-only.

alter table organizations
  add column if not exists join_policy text not null default 'open'
  check (join_policy in ('open', 'invite_only'));

-- Self-request now also requires the org to be open. An invite-only org's
-- self_accept_invite policy (already in 20260921000002) is untouched —
-- someone with an invite can still accept it regardless of join_policy.
drop policy if exists "organization_members_self_request" on organization_members;
create policy "organization_members_self_request"
  on organization_members for insert
  with check (
    user_id = auth.uid()
    and role = 'member'
    and status = 'requested'
    and exists (
      select 1 from organizations o
      where o.id = organization_id and o.status = 'active' and o.join_policy = 'open'
    )
  );
