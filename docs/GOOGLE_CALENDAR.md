# 📅 Google Calendar & Meet Integration Guide

> **Single Source of Truth** for the Google Calendar integration in Menvo, covering architecture, OAuth setup, environment variables, production deployment, and Google API verification.

---

## 1. Overview & Architecture

Menvo integrates with the Google Calendar API to automatically schedule mentorship sessions:
- When a mentor confirms an appointment, a Google Calendar event is created with a duration of 45 minutes.
- A **Google Meet** video conference link is generated automatically (`conferenceDataVersion: 1`).
- Calendar invitations and email notifications are sent automatically to both the mentor and the mentee.
- The user flow does not require mentees or mentors to authenticate with Google Calendar directly; events are generated on behalf of the platform using a central authorized OAuth Refresh Token.

---

## 2. Google Cloud Console Setup

1. Access [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Select or create your OAuth 2.0 Client ID (Application type: **Web application**).
3. In **Authorized redirect URIs**, add:
   ```text
   https://menvo.com.br/setup/google-calendar/callback
   http://localhost:3000/setup/google-calendar/callback
   ```
4. Save the Client ID and Client Secret.

---

## 3. Generating the Production Refresh Token

Run the local generation helper script:

```bash
node scripts/generate-refresh-token-production.js
```

1. The script will output an authorization URL.
2. Open the URL in your browser and sign in with the Google account that will act as the host/calendar organizer for all mentorship events.
3. Grant permissions to manage Google Calendar events.
4. You will be redirected to `https://menvo.com.br/setup/google-calendar/callback`, which displays the authorization code.
5. Copy the code into the terminal prompt.
6. The script will output the long-lived `refresh_token`.

---

## 4. Environment Variables

Configure the following variables in Vercel (Production & Preview) and in your local `.env.local`:

| Variable | Description | Example |
|---|---|---|
| `GOOGLE_CALENDAR_CLIENT_ID` | OAuth 2.0 Client ID | `*.apps.googleusercontent.com` |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | OAuth 2.0 Client Secret | `GOCSPX-...` |
| `GOOGLE_CALENDAR_REDIRECT_URI` | Authorized callback URL | `https://menvo.com.br/setup/google-calendar/callback` |
| `GOOGLE_CALENDAR_REFRESH_TOKEN` | Platform OAuth Refresh Token | `1//04...` |

---

## 5. Google API Verification Guidelines

When submitting the OAuth Consent Screen for Google Verification, use the following justifications:

### Scopes Requested
- **`https://www.googleapis.com/auth/calendar`**
  - **Purpose:** Automatically create mentorship sessions with Google Meet links upon mentor confirmation.
  - **Data Retention & Privacy:** The application does not read, index, or modify unrelated user calendar events. Calendar events are only created when an appointment is explicitly confirmed by both parties.
  - **Privacy Policy:** Published at `https://menvo.com.br/privacy`.

### Demo Video Requirements
- 2–3 minute screen recording demonstrating:
  1. Login to Menvo.
  2. Booking a mentorship session.
  3. Mentor confirming the session.
  4. Automatic calendar event creation with Google Meet link.

---

## 6. Testing & Validation

- Test endpoint: `https://menvo.com.br/test/calendar`
- Verify that:
  - Event appears in the organizer's calendar.
  - Attendees receive calendar invites.
  - Google Meet URL is populated on the appointment record in the database.
