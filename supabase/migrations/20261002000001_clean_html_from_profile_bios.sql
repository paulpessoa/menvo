-- Rich-text pastes (Word/Google Docs/translators) left HTML tags and entities
-- in profiles.bio, which the mentee profile renders as literal text.
-- Back up the affected rows first (RLS on, no policies: admin-only), then
-- strip tags and decode common entities. Restore with:
--   update profiles p set bio = b.bio
--   from profiles_bio_backup_20261002 b where b.id = p.id;

create table if not exists public.profiles_bio_backup_20261002 as
select id, bio, now() as backed_up_at
from public.profiles
where bio ~* '<[a-z/][^>]*>' or bio ~* '&(nbsp|amp|lt|gt|quot|#\d+);';

alter table public.profiles_bio_backup_20261002 enable row level security;

update public.profiles
set bio = btrim(regexp_replace(regexp_replace(regexp_replace(
    replace(replace(replace(replace(replace(replace(
      regexp_replace(regexp_replace(regexp_replace(bio,
        '<\s*br\s*/?>', E'\n', 'gi'),
        '</\s*(div|p|li|h[1-7]|blockquote|ul|ol)\s*>', E'\n', 'gi'),
        '<[^>]+>', '', 'g'),
      '&nbsp;', ' '), '&lt;', '<'), '&gt;', '>'), '&quot;', '"'), '&#39;', ''''), '&amp;', '&'),
    '[ \t]+\n', E'\n', 'g'), '\n{3,}', E'\n\n', 'g'), '^\s+|\s+$', '', 'g'))
where bio ~* '<[a-z/][^>]*>' or bio ~* '&(nbsp|amp|lt|gt|quot|#\d+);';
