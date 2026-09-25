-- AI feature `admin_mentor_review`: drafts the approval / adjustment
-- message and the announcement post on /dashboard/admin/verifications.
-- Without an entitlement row consume_ai_quota denies the feature (limit 0).
-- Admin-only and unlimited, like admin_waitlist_match; spend is still
-- bounded by the global ai_budget and metered in ai_usage_events.
insert into public.ai_entitlements (role, feature, monthly_limit) values
  ('admin', 'admin_mentor_review', null)
on conflict do nothing;
