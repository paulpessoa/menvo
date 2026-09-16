# 🧭 UI Consistency Audit — Width Patterns & Breadcrumbs

> Generated 2026-09-16 from a full-codebase pass, triggered by the founder noticing
> width divergence between screens and confusing breadcrumbs. This is a diagnosis
> document — some unambiguous bugs listed here were fixed immediately (see
> "Fixed tonight" below); the rest are design decisions the founder should confirm
> before a broad CSS pass, since they touch look-and-feel across the whole app.

---

## 1. Container/width patterns (highest impact)

There is no shared `PageContainer` component. `tailwind.config.ts`'s `container`
plugin already sets `padding: 2rem` and `max-width: 1400px` at `2xl`, but most
pages override it ad hoc, producing **five different wrapper conventions**:

| Pattern | Example routes |
|---|---|
| `container mx-auto px-4 py-N` (relies on the 1400px config cap) | `/community`, `/mentors`, `/doar`, `/quiz`, `/mentorship/mentee`, `/mentorship/mentor`, `/dashboard/admin`, `/dashboard/admin/users`, `/appointments/book/[mentorId]`, `/mentee/appointments`, `/messages` |
| `container max-w-7xl mx-auto px-4 py-N` | `/about`, `/how-it-works`, `/` (home uses `max-w-7xl px-4 md:px-6`, missing `mx-auto` — works because `center:true` is set globally, but inconsistent syntax) |
| `container mx-auto px-4 py-8 max-w-7xl` (same effect, `max-w` moved to the end) | `/dashboard/mentee`, `/dashboard/mentor`, `/dashboard/admin/feedbacks` |
| Smaller explicit caps (`max-w-3xl` / `max-w-4xl` / `max-w-5xl` / `max-w-6xl`) | `/privacy`, `/terms`, `/cookies` (`max-w-3xl`), `/contact` (`max-w-5xl`), `/settings` (`max-w-4xl`), `/dashboard/admin/emails`, `/dashboard/admin/verifications` (`max-w-6xl`) |
| No `container` class at all | `/dashboard/admin/feature-flags` (`p-8 max-w-6xl mx-auto` — uses `p-8` instead of `px-4`, skips the shared centering utility); `/onboarding` (`min-h-screen py-12 px-4 sm:px-6 lg:px-8`, **no max-width cap at all** — stretches full width on large screens) |
| Bespoke full-screen wrapper, disconnected chrome | `/appointments/confirm` — own `bg-gray-50` background and `bg-white rounded-lg shadow-lg` card instead of the shared page shell |

**Root cause**: `app/[locale]/dashboard/admin/layout.tsx` wraps all admin pages in
`min-h-screen bg-gray-50` with **no width constraint**, so every child page must
supply (and inconsistently does supply) its own container. This makes
`/dashboard/admin/*` the most visibly inconsistent single area — 8 pages under
one shared layout, each picking a different max-width and even a different
padding scheme (`px-4` vs `p-8`).

**Recommendation (not yet applied — needs a design call)**: introduce
`components/layout/PageContainer.tsx` (`container mx-auto px-4 py-8` +
optional `size` prop for `7xl`/`6xl`/`4xl`/`3xl`), then migrate pages one
section at a time, starting with `/dashboard/admin/*` since it's the highest-traffic
inconsistent area. This is a broad, visible change — do it as its own reviewed
PR, not silently.

---

## 2. Breadcrumbs

- Single ad-hoc component: `components/admin/AdminBreadcrumb.tsx`. No shared
  `components/ui/breadcrumb.tsx` primitive exists, so any breadcrumb outside
  `/dashboard/admin` would need its own implementation too.
- It's only rendered on **one page**: `dashboard/admin/users/page.tsx`.
- **Fixed tonight** (unambiguous bugs, not a design call):
  - `routeMap` had dead entries for `/dashboard/admin/mentors` and
    `/dashboard/admin/mentors/verify`, which don't correspond to any real
    route (the real route is `/dashboard/admin/verifications`).
  - `/settings` was mapped as a child of `/dashboard/admin` ("Dashboard >
    Configurações"), but `/settings` is a top-level route — clicking
    "Dashboard" from there sent non-admin users to a page they can't access.
  - Missing entries for `/dashboard/admin/emails`, `/dashboard/admin/feature-flags`,
    `/dashboard/admin/verifications`, `/dashboard/admin/users/manage` were added.
  - See `components/admin/AdminBreadcrumb.tsx` and `docs/JOURNAL.md` for the fix.
- **Still open (design call)**: should breadcrumbs render on every
  `/dashboard/admin/*` page, or none? Right now it's just the Users page.
  Recommend adding `<AdminBreadcrumb />` to the shared `dashboard/admin/layout.tsx`
  once the route map above is verified complete, so it's consistent everywhere
  without per-page wiring.

---

## Next steps for the founder
1. Confirm the `PageContainer` direction (component + which routes group into
   which `size`) before a broad width pass — this is app-wide and visible,
   worth 10 minutes of a deliberate look rather than a 3am judgment call.
2. Decide if `/appointments/confirm`'s bespoke white-card style should become
   the standard for all "standalone confirmation" screens, or migrate to the
   shared shell.
3. Once (1) is decided, moving `<AdminBreadcrumb />` into the admin layout is
   a 5-minute follow-up.
