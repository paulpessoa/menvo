# Organizations API Documentation

## Overview

This document describes the REST API endpoints for the multi-tenant organizations feature.

## Authentication

All endpoints (except where noted) require authentication via Supabase Auth. Include the user's session token in requests.

## Error Codes

| Code               | Description                           |
| ------------------ | ------------------------------------- |
| `UNAUTHORIZED`     | User is not authenticated             |
| `FORBIDDEN`        | User lacks permission for this action |
| `NOT_FOUND`        | Resource not found                    |
| `VALIDATION_ERROR` | Request validation failed             |
| `QUOTA_EXCEEDED`   | Organization quota limit reached      |
| `INVALID_TOKEN`    | Invalid or expired invitation token   |
| `TOKEN_EXPIRED`    | Invitation token has expired          |

---

## Organizations

### GET /api/organizations

List all active organizations (public endpoint).

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `type` (optional): Filter by organization type (`school`, `company`, `nonprofit`, `community`)
- `search` (optional): Search by name

**Response:**

```json
{
  "organizations": [
    {
      "id": "uuid",
      "name": "Organization Name",
      "slug": "organization-slug",
      "type": "school",
      "description": "Description",
      "logo_url": "https://...",
      "website": "https://...",
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### POST /api/organizations

Create a new organization (requires authentication).

**Request Body:**

```json
{
  "name": "Organization Name",
  "type": "school",
  "description": "Description",
  "logo_url": "https://...",
  "website": "https://...",
  "contact_email": "contact@org.com",
  "contact_phone": "+1234567890"
}
```

**Response:**

```json
{
  "organization": {
    "id": "uuid",
    "name": "Organization Name",
    "slug": "organization-slug",
    "status": "pending",
    ...
  }
}
```

### GET /api/organizations/[orgId]

Get organization details by ID.

**Response:**

```json
{
  "organization": {
    "id": "uuid",
    "name": "Organization Name",
    ...
  }
}
```

### PATCH /api/organizations/[orgId]

Update organization (requires admin role).

**Request Body:**

```json
{
  "name": "New Name",
  "description": "New description",
  ...
}
```

### POST /api/organizations/[orgId]/approve

Approve pending organization (requires platform admin).

**Response:**

```json
{
  "organization": {
    "id": "uuid",
    "status": "active",
    ...
  }
}
```

---

## Members

### GET /api/organizations/[orgId]/members

List organization members (requires admin role).

**Query Parameters:**

- `page` (optional): Page number
- `limit` (optional): Items per page
- `role` (optional): Filter by role (`admin`, `mentor`, `mentee`)
- `status` (optional): Filter by status (`active`, `invited`, `expired`, `left`)

**Response:**

```json
{
  "members": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "role": "mentor",
      "status": "active",
      "joined_at": "2024-01-01T00:00:00Z",
      "user": {
        "id": "uuid",
        "email": "user@example.com",
        "full_name": "User Name"
      }
    }
  ],
  "pagination": {...}
}
```

### POST /api/organizations/[orgId]/members

Invite a member (requires admin role).

**Request Body:**

```json
{
  "email": "user@example.com",
  "role": "mentor",
  "expires_at": "2024-12-31T23:59:59Z"
}
```

**Response:**

```json
{
  "member": {
    "id": "uuid",
    "status": "invited",
    "invitation_token": "uuid",
    ...
  }
}
```

### POST /api/organizations/[orgId]/members/bulk-invite

Bulk invite members via CSV (requires admin role).

**Request Body:**

```json
{
  "invitations": [
    {
      "email": "user1@example.com",
      "role": "mentor"
    },
    {
      "email": "user2@example.com",
      "role": "mentee"
    }
  ]
}
```

**Response:**

```json
{
  "success_count": 2,
  "failed_count": 0,
  "results": [...]
}
```

### PATCH /api/organizations/[orgId]/members/[memberId]

Update member (requires admin role).

**Request Body:**

```json
{
  "role": "admin",
  "expires_at": "2025-12-31T23:59:59Z"
}
```

### DELETE /api/organizations/[orgId]/members/[memberId]

Remove member (requires admin role). Sets status to 'left' and cancels future appointments.

---

## Invitations

### GET /api/organizations/[orgId]/invitations

List pending invitations (requires admin role).

**Query Parameters:**

- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**

```json
{
  "invitations": [...],
  "pagination": {...}
}
```

### POST /api/organizations/[orgId]/invitations/[inviteId]/resend

Resend invitation email (requires admin role).

**Response:**

```json
{
  "id": "uuid",
  "invitation_token": "new-uuid",
  "invited_at": "2024-01-01T00:00:00Z",
  "expires_at": "2024-01-31T00:00:00Z"
}
```

### POST /api/organizations/[orgId]/invitations/[inviteId]/cancel

Cancel invitation (requires admin role).

**Response:**

```json
{
  "success": true
}
```

### GET /api/organizations/invitations/validate

Validate invitation token (public endpoint).

**Query Parameters:**

- `token` (required): Invitation token

**Response:**

```json
{
  "invitation": {
    "id": "uuid",
    "role": "mentor",
    "invited_at": "2024-01-01T00:00:00Z",
    "expires_at": "2024-01-31T00:00:00Z"
  },
  "organization": {
    "id": "uuid",
    "name": "Organization Name",
    ...
  }
}
```

### POST /api/organizations/invitations/accept

Accept invitation (requires authentication).

**Request Body:**

```json
{
  "invitation_token": "uuid"
}
```

**Response:**

```json
{
  "member": {...},
  "organization": {...},
  "needsOnboarding": false
}
```

### POST /api/organizations/invitations/decline

Decline invitation (requires authentication).

**Request Body:**

```json
{
  "invitation_token": "uuid"
}
```

---

## Dashboard & Analytics

### GET /api/organizations/[orgId]/dashboard/stats

Get organization metrics (requires admin role).

**Response:**

```json
{
  "totalMentors": 10,
  "totalMentees": 50,
  "monthlyAppointments": 25,
  "completionRate": 85,
  "topTopics": [
    { "topic": "Career", "count": 15 },
    { "topic": "Tech", "count": 10 }
  ],
  "activeMentors": 8
}
```

### GET /api/organizations/[orgId]/dashboard/activity

Get activity feed (requires admin role).

**Query Parameters:**

- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**

```json
{
  "activities": [
    {
      "id": "uuid",
      "type": "member_joined",
      "message": "User Name joined the organization",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {...}
}
```

---

## Reports

### GET /api/organizations/[orgId]/reports/mentorships

Get mentorship report (requires admin role).

**Query Parameters:**

- `start_date` (optional): Start date (ISO 8601)
- `end_date` (optional): End date (ISO 8601)
- `status` (optional): Filter by appointment status

**Response:**

```json
{
  "summary": {
    "totalAppointments": 100,
    "completedAppointments": 85,
    "completionRate": 85,
    "avgDuration": 60
  },
  "topicDistribution": [...],
  "topMentors": [...],
  "timeSeriesData": [...]
}
```

### GET /api/organizations/[orgId]/reports/export

Export mentorship data as CSV (requires admin role).

**Query Parameters:**

- `start_date` (optional): Start date
- `end_date` (optional): End date

**Response:** CSV file download

---

## Mentor Visibility

### GET /api/mentors/visibility

Get mentor's visibility settings (requires mentor role).

**Response:**

```json
{
  "mentor_id": "uuid",
  "visibility_scope": "public",
  "visible_to_organizations": [],
  "organizations": []
}
```

### PATCH /api/mentors/visibility

Update visibility settings (requires mentor role).

**Request Body:**

```json
{
  "visibility_scope": "exclusive",
  "visible_to_organizations": ["org-uuid-1", "org-uuid-2"]
}
```

---

## Cron Jobs

### GET /api/cron/expire-memberships

Expire memberships (internal, requires CRON_SECRET).

**Headers:**

- `Authorization: Bearer {CRON_SECRET}`

### GET /api/cron/expire-invitations

Expire invitations (internal, requires CRON_SECRET).

**Headers:**

- `Authorization: Bearer {CRON_SECRET}`

---

## Rate Limits

- Invitation endpoints: 10 requests/minute per organization
- Bulk invite: 100 invitations per day per organization

---

## Webhooks (Future)

Not yet implemented. Planned for future releases.
