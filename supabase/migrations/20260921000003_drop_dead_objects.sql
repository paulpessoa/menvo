-- Cleanup pass (2026-09-17). Verified before writing: every table below has
-- zero rows (production count(*) checked) and zero references anywhere in
-- app/lib. See docs/STATUS.md "DB audit 2026-09-17" for the full audit.
--
-- Bare-name `drop function if exists x;` (no parameter list) is used
-- instead of guessing a signature: Postgres resolves it when the name is
-- unambiguous, and errors instead of silently no-op'ing on a mismatch —
-- which is exactly what happened to the v1 org functions in migration
-- 20260921000000 (their `(uuid)` guess didn't match the real signature,
-- so the DROP silently did nothing and all 8 are still live today).

-- 1. Retry dropping the orphaned v1 organizations functions.
drop function if exists check_organization_quota;
drop function if exists get_mentors_by_organization;
drop function if exists is_organization_admin;
drop function if exists user_has_partner_access;
drop function if exists get_expiring_memberships;
drop function if exists expire_pending_invitations;
drop function if exists get_visible_mentor_ids;
drop function if exists is_mentor_visible_to_user;

-- 2. mentor_suggestions cluster: table, its view, and every function that
-- only exists to read/write it. Zero rows, zero code references.
drop view if exists mentor_suggestions_view;
drop function if exists get_mentor_suggestions_stats;
drop function if exists get_most_active_suggesters;
drop function if exists get_most_suggested_free_topics;
drop function if exists get_most_suggested_inclusion_tags;
drop function if exists get_most_suggested_knowledge_topics;
drop function if exists mark_old_suggestions_as_expired;
drop table if exists mentor_suggestions;

-- 3. Standalone dead tables: no other object depends on these.
drop table if exists admin_actions;
drop table if exists quiz_mentors;
drop table if exists verification_logs;
drop table if exists mentor_verification;
