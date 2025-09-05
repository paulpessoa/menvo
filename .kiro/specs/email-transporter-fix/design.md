# Design Document

## Overview

The build error is caused by a simple typo in the Nodemailer API usage. The code currently uses `nodemailer.createTransporter()` which doesn't exist, instead of the correct `nodemailer.createTransport()` method. This fix requires updating the method name and ensuring proper error handling around the email configuration.

## Architecture

The email system follows a simple architecture:
- **Configuration Layer**: Environment variables for SMTP settings
- **Transport Layer**: Nodemailer SMTP transporter instance
- **Service Layer**: Migration notification functions
- **API Layer**: REST endpoint for triggering notifications

## Components and Interfaces

### Email Configuration
```typescript
interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}
```

### Transporter Instance
```typescript
// Current (incorrect)
const transporter = nodemailer.createTransporter(config)

// Fixed (correct)
const transporter = nodemailer.createTransport(config)
```

### Migration Notification Service
- `sendMigrationNotification()` - Send single notification
- `sendBatchMigrationNotifications()` - Send batch notifications
- `scheduleNotifications()` - Scheduled batch processing

## Data Models

### Environment Variables Required
```env
BREVO_SMTP_USER=your_smtp_user
BREVO_SMTP_PASSWORD=your_smtp_password
BREVO_FROM_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Email Template Data
```typescript
interface MigrationNotificationData {
  email: string
  firstName?: string
  lastName?: string
  temporaryPassword: string
  loginUrl: string
}
```

## Error Handling

### Transporter Initialization
- Validate environment variables before creating transporter
- Provide fallback configuration for development
- Log configuration errors with helpful messages

### Email Sending
- Catch and log SMTP errors
- Implement retry logic for failed sends
- Track notification status in database

### Build-time Safety
- Ensure transporter creation doesn't fail during build
- Use lazy initialization if needed
- Provide mock transporter for testing

## Testing Strategy

### Unit Tests
- Test transporter creation with valid/invalid config
- Test email template generation
- Test batch processing logic

### Integration Tests
- Test actual email sending in development
- Test API endpoint authentication and authorization
- Test database updates after successful sends

### Build Tests
- Verify build completes without errors
- Test import/export of migration-notifications module
- Validate TypeScript compilation

## Implementation Plan

1. **Fix Transporter Method**: Change `createTransporter` to `createTransport`
2. **Add Error Handling**: Wrap transporter creation in try-catch
3. **Environment Validation**: Check required env vars at startup
4. **Testing**: Add unit tests for email functionality
5. **Documentation**: Update comments and error messages