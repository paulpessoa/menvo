-- Migration: allow reading active memberships of active, open organizations (C-O4)
-- This enables public mentor profiles and cards to display the "Mentor da {org}" chip.

create policy "organization_members_public_read_open_orgs"
  on organization_members for select
  using (
    status = 'active'
    and exists (
      select 1 from organizations o
      where o.id = organization_members.organization_id
        and o.status = 'active'
        and o.join_policy = 'open'
    )
  );
