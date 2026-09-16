# 📊 Clarity Insights — Snapshot 2026-09-16

> Pulled live from Microsoft Clarity via the `clarity` MCP server (see
> [`.mcp.json`](../.mcp.json)). Numbers below cover the last 3 months unless
> stated otherwise. This is a point-in-time snapshot, not a live dashboard —
> re-run these queries any time by asking Claude to query Clarity.

## Traffic volume
- **1,171 sessions / 1,098 unique users** in the last 3 months.
- Monthly trend (distinct sessions): Apr **795** → May **173** → Jun **261** →
  Jul **289** → Aug **305** → Sep (partial) **446**. April's spike and May's
  crash are worth investigating — likely a specific campaign/post drove
  April, and something (bug, or just post-launch drop-off) killed May.
  September is trending back up.
- **90.4% Brazil**, rest scattered (US, China, Vietnam, Ireland, Angola...) —
  overwhelmingly a Brazilian audience so far, consistent with the current
  positioning.

## Traffic sources
- **Google organic: 567 sessions (48%)** — SEO is already the biggest channel.
- **Direct: 376 (32%)**.
- **LinkedIn referral: 91** — meaningfully ahead of Bing (25) or ChatGPT (16).
- ChatGPT referrals (16) confirm the `llms.txt` / AI-crawler SEO work
  (`docs/SEO_GUIDE.md`) is paying off, even if small in absolute terms.

## Device mix
- **PC: 855 (73%) vs Mobile: 313 (27%)**. Skews desktop — matches the fact
  that most core flows (search, scheduling, profile) are used at a desk.
  Worth keeping in mind before investing further in mobile-only polish.

## Top pages (by unique sessions)
1. `/` — 370
2. `/mentors` — 274
3. `/login` — 100
4. `/dashboard/mentee` — 97
5. `/signup` — 68
6. `/en` — 50
7. `/how-it-works` — 46
8. `/mentors/paulmspessoa` — 40 (founder's own profile — expected, it's the
   most-shared link)
9. `/profile` — 38
10. `/about` — 32

## UX friction signals (this is the actionable part)
- **`/mentors` has 123 dead clicks and 5 rage clicks in 3 months** — by far
  the highest of any page. This is the main mentor discovery page and just
  went through several rounds of search/filter redesign per
  `docs/JOURNAL.md` (magic search, filter drawer, active chips). Worth a
  session recording review (`list-session-recordings` tool, filter by
  `visitedUrls: [{url: "/mentors", operator: "contains"}]` +
  `deadClickPresent: true`) to see exactly what people are clicking that
  doesn't respond.
- **`/mentors/undefined` appeared in the data** — confirmed a real bug:
  mentor profile links rendered without a slug/id fallback in two places
  (mentee's favorites list, mentor's "view public profile" quick action).
  **Fixed tonight** (see git log — `fix(admin): unify breadcrumb across admin
  section, fix stale routes and mentor link bugs`). This was likely already
  partly mitigated by the "sanitize hallucinated mentor ids" fix from
  2026-09-16, so re-check this metric in a couple of weeks to confirm it's
  gone to zero.
- JS errors are essentially negligible (2 total in 3 months) — the app is
  stable at the code level; friction is UX/layout, not crashes. This matches
  the founder's own read (width/breadcrumb complaints, not "broken" complaints).

## Suggested next Clarity queries (not run tonight, for follow-up)
- Session recordings specifically on `/mentors` filtered by dead clicks, to
  see the exact element people expect to be clickable.
- Funnel: `/quiz` start → completion → `/mentors` → first booking, to see
  where mentee activation drops off (ties into `docs/BACKLOG.md`'s existing
  "Mentee Activation" tracking item).
- Compare mobile vs desktop dead-click rate on `/mentors` specifically —
  filter drawers are a common mobile dead-click source.
