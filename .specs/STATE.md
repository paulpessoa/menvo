# Project State & Architectural Decisions

## Architectural Decisions

### AD-001: Minimalist Text-Only Buttons & Signup Design Token Unification
- **Date:** 2026-09-08
- **Context:** The signup page (`/signup`) established a polished, high-end visual standard: `rounded-xl` borders, `h-12` touch targets, tactile micro-interactions (`active:scale-[0.98]`, subtle hover lift), brand-colored glow shadows (`shadow-md shadow-primary/20`), and `border-2` outlines. However, other pages (like `/login`, home hero/CTA, and modals) still used legacy shadcn `rounded-md` with `h-10` and inconsistent inline icons (such as `<ArrowRight />` on submit buttons).
- **Decision:**
  1. Elevate `components/ui/button.tsx` at the design token level so all buttons globally inherit `rounded-xl`, active press feedback, and refined default/outline variants.
  2. Strip decorative inline icons from standard action buttons across the entire platform, favoring clean, confident typography.
  3. Strictly retain icons only for: (a) asynchronous loading spinners (`Loader2`), (b) third-party authentication logos (Google, LinkedIn SVGs), and (c) pure icon-only buttons (`size="icon"`, such as the notification bell or close "X").
  4. Redesign `/login` to match the exact card container geometry (`rounded-[2.5rem]`), input styles (`h-11 rounded-xl bg-muted/20 border-none`), and button dimensions of `/signup`.
- **Consequences:** Eliminates visual noise, speeds up scanning and readability, creates platform-wide visual harmony, and ensures that any future button automatically inherits the high-tier Menvo styling without repetitive utility classes.

---

## Handoff Snapshot

- **Branch:** main
- **Last Commit:** 65d92c4d
- **Active Feature:** button-design-system-modernization
- **Next Step:** Review specification and task breakdown with the user, then proceed with implementation.
