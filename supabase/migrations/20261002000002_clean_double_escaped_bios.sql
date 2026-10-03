-- Second pass for bios that were double-escaped (&lt;span ...&gt;), so the
-- first cleanup decoded them into new tags. Originals are in
-- profiles_bio_backup_20261002. Two other bios (f368746e..., c5b792b8...) start
-- with a mangled CSS fragment and need a manual edit, so they are left alone.

update public.profiles
set bio = btrim(regexp_replace(regexp_replace(regexp_replace(
    replace(replace(replace(replace(replace(replace(
      regexp_replace(regexp_replace(regexp_replace(bio,
        '<\s*br\s*/?>', E'\n', 'gi'),
        '</\s*(div|p|li|h[1-7]|blockquote|ul|ol)\s*>', E'\n', 'gi'),
        '<[^>]+>', '', 'g'),
      '&nbsp;', ' '), '&lt;', '<'), '&gt;', '>'), '&quot;', '"'), '&#39;', ''''), '&amp;', '&'),
    '[ \t]+\n', E'\n', 'g'), '\n{3,}', E'\n\n', 'g'), '^\s+|\s+$', '', 'g'))
where id in (
  '55eae4a1-985d-4054-8270-c16b8cef07f4',
  '6005ec40-92c3-4168-b314-1454020279e8'
);
