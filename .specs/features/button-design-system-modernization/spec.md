# Button Design System Modernization & Minimalist Text-Only Buttons

## Problem Statement
The signup screen (`/signup`) introduced a modern, elevated aesthetic with `rounded-xl` corners, generous `h-12` touch targets, tactile press feedback (`active:scale-[0.98]`), brand glow shadows (`shadow-md shadow-primary/20`), and `border-2` outlines. However, other parts of the application (such as the login screen, homepage hero/CTA sections, catalog filters, and dialogs) still rely on default `rounded-md` corners and inconsistent inline icons (such as redundant `<ArrowRight />` chevrons). These icons introduce unnecessary visual noise and distract from clear, confident action typography. The platform needs a unified, minimalist button design system that propagates the signup aesthetic everywhere while stripping decorative icons from action buttons.

## Out of Scope
- Modifying brand logos in social authentication buttons (Google, LinkedIn SVGs remain).
- Modifying asynchronous loading spinners (`Loader2` with `animate-spin` remains for async feedback).
- Removing icons from pure icon-only buttons (`size="icon"`, such as notification bell, theme toggle, and dialog close "X").
- Redesigning non-auth page layouts or altering business logic.

## Assumptions & Open Questions

| Assumption | Chosen default | Rationale |
|---|---|---|
| Button token elevation location | Update `components/ui/button.tsx` | Centralizes styling so 80%+ of buttons across the app inherit signup styles with zero duplication |
| Treatment of decorative icons | Remove inline decorative icons from text buttons | Stripping arrows and redundant icons produces cleaner visual hierarchy and aligns with modern design standards |
| Asynchronous feedback indicator | Keep `Loader2` during loading/submitting states | Essential for accessibility and immediate tactile feedback during network operations |
| Social authentication buttons | Retain official Google and LinkedIn SVGs | Brand recognition requires official third-party logos on OAuth buttons |

**Open questions:** none

## User Stories

### US-1: Global Button Token Elevation
As a user navigating any screen on the platform, I want buttons to have a consistent, modern, tactile appearance so that interactions feel responsive and cohesive.

**Acceptance Criteria:**
1. WHEN a user views any standard button THE SYSTEM SHALL render it with `rounded-xl` border radius.
2. WHEN a user hovers or clicks on a button THE SYSTEM SHALL apply smooth transitions with active compression feedback (`active:scale-[0.98]`).
3. WHEN a user views a primary default button THE SYSTEM SHALL apply brand glow elevation (`shadow-md shadow-primary/20`).
4. WHEN a user views an outline button THE SYSTEM SHALL render it with a distinct `border-2` border.

### US-2: Minimalist Text-Only Button Aesthetics
As a user reading action buttons, I want clean typography without redundant icons so that I can immediately scan and understand the available actions.

**Acceptance Criteria:**
1. WHEN a user views a text action button THE SYSTEM SHALL display clean text without trailing or leading decorative chevrons or arrows.
2. IF a button is in a submitting or loading state THEN THE SYSTEM SHALL display the spinning `Loader2` indicator to indicate progress.
3. WHERE a button is a third-party social login provider THE SYSTEM SHALL preserve the provider's official logo icon.
4. WHERE a button is an icon-only button THE SYSTEM SHALL preserve the functional icon.

### US-3: Login Screen Visual Alignment
As a user accessing the login screen, I want the card container, inputs, and buttons to match the visual quality of the signup screen.

**Acceptance Criteria:**
1. WHEN a user navigates to `/login` THE SYSTEM SHALL render a card container with `rounded-[2.5rem]` and `shadow-2xl shadow-primary/5`.
2. WHEN a user enters credentials on `/login` THE SYSTEM SHALL provide inputs with `h-11 rounded-xl bg-muted/20 border-none`.
3. WHEN a user views the login action button THE SYSTEM SHALL render an `h-12 rounded-xl` primary button with pure text.

## Requirement Traceability

| Requirement ID | Description | Status |
|---|---|---|
| BTN-01 | Elevate `components/ui/button.tsx` variants to `rounded-xl`, tactile active scale, and brand glow | pending |
| BTN-02 | Strip decorative icons from signup and login action buttons | pending |
| BTN-03 | Redesign `/login` card, inputs, and button sizing to match `/signup` | pending |
| BTN-04 | Audit and remove decorative icons from Home page hero, features, and CTA buttons | pending |
| BTN-05 | Audit and remove decorative icons from Mentors catalog and booking dialogs | pending |
| BTN-06 | Verify TypeScript compilation and unit test suite integrity | pending |
