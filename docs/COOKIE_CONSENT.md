# 🍪 Cookie Consent & Privacy Compliance (LGPD/GDPR)

> **Technical documentation** for Menvo's cookie consent management system, Microsoft Clarity integration, and privacy compliance.

---

## 1. Core Architecture

Cookie consent is managed client-side through:
1. **`components/cookie-consent-banner.tsx`**: UI banner and preference modal.
2. **`app/[locale]/layout.tsx`**: Script injection for Microsoft Clarity and Google Analytics.

---

## 2. Storage & State

Consent state is preserved in browser `localStorage`:

```javascript
// User cookie category preferences
"cookie-consent" -> {"necessary":true,"analytics":true,"functional":false}

// ISO timestamp of consent grant
"cookie-consent-date" -> "2026-09-05T20:00:00.000Z"
```

### Cookie Categories
```typescript
interface CookiePreferences {
  necessary: boolean   // Essential cookies (session, auth) — always true
  analytics: boolean   // Microsoft Clarity & GA4 tracking
  functional: boolean  // UI preferences (future expansion)
}
```

---

## 3. User Flow

### First Visit (Unset State)
1. User accesses any public page.
2. Microsoft Clarity initializes in non-consented mode (`clarity('consent', false)`).
3. The banner renders with a 1-second delay to avoid blocking initial content paint.
4. User selects **Accept All**, **Necessary Only**, or customizes via **Preferences Modal**.
5. Choice is saved to `localStorage` and dispatched to Clarity (`window.clarity('consent', true/false)`).

### Subsequent Visits
1. Client initializes and reads `localStorage`.
2. Consent is immediately applied without flashing the banner.
3. If consent is older than 6 months or expired, the banner will re-prompt.

---

## 4. Key Integration Functions

```typescript
// Dispatches consent signal to Microsoft Clarity
const applyClarityConsent = (analyticsConsent: boolean) => {
  if (typeof window !== "undefined" && (window as any).clarity) {
    (window as any).clarity("consent", analyticsConsent)
  }
}

// Commits preferences and applies consent
const savePreferences = (prefs: CookiePreferences) => {
  localStorage.setItem("cookie-consent", JSON.stringify(prefs))
  localStorage.setItem("cookie-consent-date", new Date().toISOString())
  applyClarityConsent(prefs.analytics)
  setShowBanner(false)
}
```
