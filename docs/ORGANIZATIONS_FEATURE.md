# Multi-Tenant Organizations Feature

## Overview

This document provides a comprehensive overview of the multi-tenant organizations feature implemented in the Menvo platform.

## Status: Backend Complete ✅

**Implementation Progress: 28/90 tasks (31%)**

### Completed Components

#### ✅ Backend APIs (100% Complete)

All backend APIs are fully implemented and functional:

- **Organization Management**

  - Create, read, update organizations
  - Organization approval workflow
  - Status management (pending, active, suspended)

- **Member Management**

  - Invite members (individual and bulk)
  - List, update, remove members
  - Role management (admin, mentor, mentee)
  - Membership lifecycle (active, invited, expired, left)

- **Invitation System**

  - Send, resend, cancel invitations
  - Accept, decline invitations
  - Token validation
  - 30-day expiration
  - Email notifications

- **Dashboard & Analytics**

  - Organization metrics and statistics
  - Activity feed
  - Mentorship reports
  - CSV export

- **Mentor Visibility**

  - Public vs exclusive visibility
  - Organization-based filtering
  - Mentor listing integration

- **Appointment Integration**
  - Organization context detection
  - Exclusive mentor validation
  - Automatic cancellation on member removal

#### ✅ Infrastructure (100% Complete)

- **Database Schema**: All tables, indexes, and functions created
- **Cron Jobs**: Membership and invitation expiration
- **Rate Limiting**: Invitation endpoint protection
- **Email Service**: Professional templates with branding

#### ✅ Documentation (100% Complete)

- **API Documentation**: Complete endpoint reference
- **User Guides**: Admin and mentor guides
- **Environment Variables**: Setup and configuration
- **Feature Overview**: This document

### Pending Components

#### ⏳ Frontend (0% Complete)

- React components (OrganizationCard, MembersList, etc.)
- Pages (dashboard, settings, reports, etc.)
- Admin pages
- User settings integration

#### ⏳ Testing (0% Complete)

- Integration tests
- Component tests
- End-to-end tests

---

## Architecture

### Database Schema

```
organizations
├── id (uuid, PK)
├── name (text)
├── slug (text, unique)
├── type (enum: school, company, nonprofit, community)
├── status (enum: pending, active, suspended)
├── quotas (jsonb)
└── timestamps

organization_members
├── id (uuid, PK)
├── organization_id (uuid, FK)
├── user_id (uuid, FK)
├── role (enum: admin, mentor, mentee)
├── status (enum: invited, active, expired, left, cancelled, declined)
├── invitation_token (uuid)
├── lifecycle dates
└── timestamps

mentor_visibility_settings
├── id (uuid, PK)
├── mentor_id (uuid, FK, unique)
├── visibility_scope (enum: public, exclusive)
├── visible_to_organizations (uuid[])
└── timestamps

organization_activity_log
├── id (uuid, PK)
├── organization_id (uuid, FK)
├── activity_type (text)
├── actor_id (uuid, FK)
├── target_id (uuid, FK)
├── metadata (jsonb)
└── created_at
```

### API Endpoints

#### Organizations

- `GET /api/organizations` - List organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/[orgId]` - Get organization
- `PATCH /api/organizations/[orgId]` - Update organization
- `POST /api/organizations/[orgId]/approve` - Approve organization (admin)

#### Members

- `GET /api/organizations/[orgId]/members` - List members
- `POST /api/organizations/[orgId]/members` - Invite member
- `POST /api/organizations/[orgId]/members/bulk-invite` - Bulk invite
- `PATCH /api/organizations/[orgId]/members/[memberId]` - Update member
- `DELETE /api/organizations/[orgId]/members/[memberId]` - Remove member

#### Invitations

- `GET /api/organizations/[orgId]/invitations` - List invitations
- `POST /api/organizations/[orgId]/invitations/[inviteId]/resend` - Resend
- `POST /api/organizations/[orgId]/invitations/[inviteId]/cancel` - Cancel
- `GET /api/organizations/invitations/validate` - Validate token
- `POST /api/organizations/invitations/accept` - Accept invitation
- `POST /api/organizations/invitations/decline` - Decline invitation

#### Dashboard & Reports

- `GET /api/organizations/[orgId]/dashboard/stats` - Metrics
- `GET /api/organizations/[orgId]/dashboard/activity` - Activity feed
- `GET /api/organizations/[orgId]/reports/mentorships` - Report
- `GET /api/organizations/[orgId]/reports/export` - CSV export

#### Mentor Visibility

- `GET /api/mentors/visibility` - Get settings
- `PATCH /api/mentors/visibility` - Update settings

#### Cron Jobs

- `GET /api/cron/expire-memberships` - Daily job
- `GET /api/cron/expire-invitations` - Daily job

---

## Features

### 1. Organization Management

**Create Organization**

- Any authenticated user can create an organization
- Requires approval from platform admin
- Status: pending → active

**Organization Types**

- School/University
- Company
- Nonprofit
- Community

**Quotas**

- Max mentors
- Max mentees
- Max monthly appointments
- Configurable per organization

### 2. Member Management

**Roles**

- **Admin**: Full control over organization
- **Mentor**: Can provide mentorship
- **Mentee**: Can receive mentorship

**Invitation Flow**

1. Admin invites user by email
2. User receives email with token
3. User accepts/declines invitation
4. Membership becomes active

**Bulk Invitations**

- CSV upload support
- Up to 100 invitations per file
- Detailed success/failure reporting

**Membership Lifecycle**

- **Invited**: Pending acceptance
- **Active**: Full member
- **Expired**: Membership expired
- **Left**: User left voluntarily
- **Cancelled**: Invitation cancelled
- **Declined**: User declined invitation

### 3. Mentor Visibility

**Public Visibility**

- Mentor visible to all users
- Anyone can book appointments
- Default setting

**Exclusive Visibility**

- Mentor visible only to selected organizations
- Only organization members can book
- Useful for corporate/institutional programs

**Features**

- Mentor controls their own visibility
- Can select multiple organizations
- Automatic filtering in mentor listing
- Booking validation

### 4. Dashboard & Analytics

**Organization Metrics**

- Total mentors/mentees
- Monthly appointments
- Completion rate
- Top topics
- Active mentors

**Activity Feed**

- Member joins/leaves
- Invitations sent/accepted
- Settings changes
- Last 30 days

**Reports**

- Mentorship summary
- Topic distribution
- Top mentors
- Time series data
- CSV export

### 5. Email Notifications

**Templates**

- Organization invitation
- Organization approved
- Member joined
- Member left
- Membership expired

**Features**

- Organization branding (logo, name)
- Professional HTML templates
- Brevo integration
- Error handling

### 6. Rate Limiting

**Limits**

- 10 invitations per minute per org
- 100 invitations per day per org
- 5 bulk invites per hour per org

**Implementation**

- In-memory store (production: use Redis)
- Automatic cleanup
- User-friendly error messages

### 7. Security

**Authentication**

- All endpoints require authentication
- Role-based access control
- Service role for admin operations

**Authorization**

- Organization admins only
- Platform admins for approval
- Membership validation

**Data Protection**

- Row Level Security (RLS)
- Invitation token validation
- Rate limiting
- Input validation

---

## Configuration

### Environment Variables

Required:

```bash
SUPABASE_SERVICE_ROLE_KEY=xxx
BREVO_API_KEY=xxx
BREVO_SENDER_EMAIL=noreply@menvo.com.br
BREVO_SENDER_NAME=MENVO
NEXT_PUBLIC_SITE_URL=https://menvo.com.br
CRON_SECRET=xxx
```

See `docs/ENVIRONMENT_VARIABLES.md` for details.

### Vercel Cron

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-memberships",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/expire-invitations",
      "schedule": "0 0 * * *"
    }
  ]
}
```

---

## Usage Examples

### Creating an Organization

```typescript
const response = await fetch("/api/organizations", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "My Organization",
    type: "company",
    description: "A great organization",
    logo_url: "https://...",
    website: "https://...",
    contact_email: "contact@org.com",
  }),
});
```

### Inviting a Member

```typescript
const response = await fetch("/api/organizations/[orgId]/members", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "user@example.com",
    role: "mentor",
    expires_at: "2025-12-31T23:59:59Z",
  }),
});
```

### Setting Mentor Visibility

```typescript
const response = await fetch("/api/mentors/visibility", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    visibility_scope: "exclusive",
    visible_to_organizations: ["org-uuid-1", "org-uuid-2"],
  }),
});
```

---

## Testing

### Manual Testing Checklist

- [ ] Create organization
- [ ] Approve organization (admin)
- [ ] Invite member
- [ ] Accept invitation
- [ ] Decline invitation
- [ ] Resend invitation
- [ ] Cancel invitation
- [ ] Remove member
- [ ] Update member role
- [ ] Bulk invite
- [ ] View dashboard stats
- [ ] View activity feed
- [ ] Generate report
- [ ] Export CSV
- [ ] Set mentor visibility
- [ ] Filter mentors by organization
- [ ] Book appointment with exclusive mentor
- [ ] Test rate limiting
- [ ] Test cron jobs

### Automated Testing

Not yet implemented. See tasks 77-78.

---

## Deployment

### Database Migrations

```bash
# Review migrations
ls supabase/migrations/

# Apply to staging
supabase db push --db-url $STAGING_DATABASE_URL

# Apply to production
supabase db push --db-url $PRODUCTION_DATABASE_URL
```

### Vercel Deployment

1. Set environment variables in Vercel dashboard
2. Deploy branch: `git push origin feature/multi-tenant-organizations`
3. Vercel auto-deploys
4. Verify cron jobs are configured

### Post-Deployment

1. Test organization creation
2. Test invitation flow
3. Verify emails are sent
4. Check cron jobs execute
5. Monitor error logs

---

## Troubleshooting

### Common Issues

**"Unauthorized" errors**

- Check `SUPABASE_SERVICE_ROLE_KEY` is set
- Verify user is authenticated

**Emails not sending**

- Check `BREVO_API_KEY` is valid
- Verify sender email is verified in Brevo
- Check Brevo logs

**Cron jobs not running**

- Verify `CRON_SECRET` is set
- Check `vercel.json` configuration
- View Vercel logs

**Rate limit errors**

- Wait for reset time
- Check if limits are appropriate
- Consider using Redis for production

---

## Future Enhancements

### Planned Features

- Advanced quotas with alerts
- Billing integration
- Advanced analytics
- White-label options
- API for external integrations
- SSO integration
- Custom roles and permissions

### Frontend Development

- React components (tasks 48-58)
- Pages (tasks 59-73)
- Admin interface
- User settings

### Testing

- Integration tests (task 77)
- Component tests (task 78)
- E2E tests (task 88)

---

## Support

- **Documentation**: `docs/` folder
- **API Reference**: `docs/api/organizations.md`
- **User Guides**: `docs/guides/`
- **Environment Setup**: `docs/ENVIRONMENT_VARIABLES.md`

---

## Contributors

This feature was implemented following the spec-driven development methodology with comprehensive requirements, design, and task planning.

**Implementation Date**: November 2024

**Status**: Backend Complete, Frontend Pending
