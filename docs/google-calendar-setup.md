# Google Calendar Integration Setup

This document explains how to set up Google Calendar integration for the mentorship platform.

## Prerequisites

1. A Google Cloud Project with Calendar API enabled
2. OAuth 2.0 credentials configured
3. Environment variables properly set

## Step 1: Google Cloud Console Setup

### 1.1 Create or Select a Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one

### 1.2 Enable Google Calendar API
1. Navigate to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

### 1.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Add authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/google-calendar/callback`
   - For production: `https://yourdomain.com/api/auth/google-calendar/callback`
5. Save the Client ID and Client Secret

### 1.4 Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Fill in the required information
3. Add the following scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
4. Add test users if your app is in testing mode

## Step 2: Environment Variables

Add the following variables to your `.env.local` file:

```env
# Google Calendar API
GOOGLE_CALENDAR_CLIENT_ID=your_client_id_here
GOOGLE_CALENDAR_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALENDAR_REFRESH_TOKEN=your_refresh_token_here
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/auth/google-calendar/callback
```

## Step 3: Get Refresh Token

### 3.1 Start the Development Server
```bash
npm run dev
```

### 3.2 Get Authorization URL
Make a GET request to `/api/auth/google-calendar/authorize`:

```bash
curl http://localhost:3000/api/auth/google-calendar/authorize
```

This will return an authorization URL.

### 3.3 Complete OAuth Flow
1. Visit the authorization URL in your browser
2. Sign in with your Google account
3. Grant the requested permissions
4. You'll be redirected to the callback URL
5. Check the server logs for the refresh token

### 3.4 Update Environment Variables
Copy the refresh token from the logs and add it to your `.env.local` file.

## Step 4: Test the Integration

Run the test script to verify everything is working:

```bash
node scripts/test-google-calendar.js
```

If successful, you should see:
- ✅ All required environment variables are set
- 📅 Creating test calendar event...
- ✅ Test event created successfully!
- Event details with ID, HTML link, and Meet link

## Step 5: Production Setup

For production deployment:

1. Update the redirect URI in Google Cloud Console to your production domain
2. Set the environment variables in your hosting platform (Vercel, etc.)
3. Ensure your OAuth consent screen is published (not in testing mode)

## Troubleshooting

### Common Errors

#### `invalid_grant` Error
This usually means:
- The refresh token has expired
- The OAuth consent screen needs re-authorization
- The client credentials are incorrect

**Solution:** Re-run the OAuth flow to get a new refresh token.

#### `insufficient_permissions` Error
This means the OAuth scopes are not properly configured.

**Solution:** 
1. Check that the required scopes are added in Google Cloud Console
2. Re-authorize the application with the correct scopes

#### `API not enabled` Error
The Google Calendar API is not enabled for your project.

**Solution:** Enable the Google Calendar API in Google Cloud Console.

## API Endpoints

### Authorization
- `GET /api/auth/google-calendar/authorize` - Get authorization URL
- `GET /api/auth/google-calendar/callback` - OAuth callback handler

### Testing
- `POST /api/calendar/test` - Create a test calendar event
- `GET /api/calendar/test` - Get test endpoint information

## Security Notes

1. Never commit your `.env.local` file to version control
2. Use different OAuth credentials for development and production
3. Regularly rotate your client secrets
4. Monitor API usage in Google Cloud Console
5. Implement proper error handling and logging

## Next Steps

After setting up the Google Calendar integration:

1. Implement the appointment booking flow
2. Add calendar event management (update, delete)
3. Set up webhook notifications for calendar changes
4. Add timezone handling for international users
5. Implement recurring appointment support