# Multi-Tenant Organizations - Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Environment Variables

Ensure all required environment variables are set:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Email Service (Brevo)
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=

# Application
NEXT_PUBLIC_SITE_URL=

# Cron Jobs
CRON_SECRET=
```

### 2. Database Migrations

Run all migrations in order:

```bash
# Connect to Supabase
supabase link --project-ref your-project-ref

# Push migrations
supabase db push

# Verify migrations
supabase db diff
```

### 3. Verify Database Tables

Check that all tables were created:

- `organizations`
- `organization_members`
- `mentor_visibility_settings`
- `organization_activity_log`

### 4. Verify RLS Policies

Ensure Row-Level Security is enabled on all tables with proper policies.

---

## 🚀 Deployment Steps

### Step 1: Deploy Database Changes

```bash
# 1. Backup current database
supabase db dump > backup_$(date +%Y%m%d).sql

# 2. Run migrations
supabase db push

# 3. Verify tables
psql $DATABASE_URL -c "\dt public.*"
```

### Step 2: Deploy Application

```bash
# 1. Build application
npm run build

# 2. Test build locally
npm run start

# 3. Deploy to Vercel (or your platform)
vercel --prod
```

### Step 3: Configure Cron Jobs

#### Vercel Cron Configuration

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-memberships",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/expire-invitations",
      "schedule": "0 1 * * *"
    }
  ]
}
```

#### Alternative: External Cron Service

If not using Vercel Cron, set up external service (e.g., cron-job.org):

```bash
# Daily at midnight
curl -X GET "https://your-domain.com/api/cron/expire-memberships" \
  -H "Authorization: Bearer $CRON_SECRET"

# Daily at 1 AM
curl -X GET "https://your-domain.com/api/cron/expire-invitations" \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Step 4: Seed Default Data (Optional)

```sql
-- Create default visibility settings for existing mentors
INSERT INTO mentor_visibility_settings (mentor_id, visibility_scope)
SELECT id, 'public'
FROM profiles
WHERE is_mentor = true
ON CONFLICT (mentor_id) DO NOTHING;
```

### Step 5: Test Critical Flows

1. **Organization Creation**

   ```bash
   # Test creating an organization
   curl -X POST https://your-domain.com/api/organizations \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Org","type":"company","contact_email":"test@example.com"}'
   ```

2. **Invitation Flow**

   ```bash
   # Test sending invitation
   curl -X POST https://your-domain.com/api/organizations/{orgId}/members \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","role":"mentor"}'
   ```

3. **Visibility Settings**
   ```bash
   # Test updating visibility
   curl -X PATCH https://your-domain.com/api/mentors/visibility \
     -H "Content-Type: application/json" \
     -d '{"visibility_scope":"exclusive","visible_to_organizations":["org-id"]}'
   ```

---

## 🔍 Post-Deployment Verification

### 1. Check Database

```sql
-- Verify organizations table
SELECT COUNT(*) FROM organizations;

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'organization%';

-- Check for any errors in activity log
SELECT * FROM organization_activity_log
ORDER BY created_at DESC
LIMIT 10;
```

### 2. Test User Flows

- [ ] Create a test organization
- [ ] Approve organization (as admin)
- [ ] Send invitation
- [ ] Accept invitation
- [ ] Configure mentor visibility
- [ ] View organization dashboard
- [ ] Generate report
- [ ] Export CSV

### 3. Monitor Logs

```bash
# Vercel logs
vercel logs --follow

# Check for errors
vercel logs | grep ERROR

# Monitor cron jobs
vercel logs --since 24h | grep cron
```

### 4. Email Delivery

- [ ] Test invitation email delivery
- [ ] Test approval notification
- [ ] Test expiration warnings
- [ ] Verify email templates render correctly

---

## 🐛 Troubleshooting

### Issue: Migrations Fail

**Solution:**

```bash
# Reset migrations (CAUTION: Development only)
supabase db reset

# Or manually fix conflicts
supabase db diff
```

### Issue: RLS Policies Block Queries

**Solution:**

```sql
-- Temporarily disable RLS for debugging (NOT for production)
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- Check policy definitions
SELECT * FROM pg_policies WHERE tablename = 'organizations';

-- Re-enable after fixing
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
```

### Issue: Emails Not Sending

**Solution:**

1. Verify Brevo API key is correct
2. Check Brevo dashboard for delivery status
3. Verify sender email is verified in Brevo
4. Check application logs for email errors

### Issue: Cron Jobs Not Running

**Solution:**

1. Verify `CRON_SECRET` is set correctly
2. Check Vercel Cron configuration
3. Test cron endpoints manually
4. Check Vercel logs for cron execution

---

## 📊 Monitoring

### Key Metrics to Track

1. **Organization Growth**

   ```sql
   SELECT
     DATE(created_at) as date,
     COUNT(*) as new_orgs
   FROM organizations
   GROUP BY DATE(created_at)
   ORDER BY date DESC;
   ```

2. **Invitation Acceptance Rate**

   ```sql
   SELECT
     status,
     COUNT(*) as count,
     ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
   FROM organization_members
   GROUP BY status;
   ```

3. **Active Organizations**

   ```sql
   SELECT COUNT(*)
   FROM organizations
   WHERE status = 'active';
   ```

4. **Membership Expirations**
   ```sql
   SELECT COUNT(*)
   FROM organization_members
   WHERE expires_at < NOW() + INTERVAL '7 days'
   AND status = 'active';
   ```

### Set Up Alerts

1. **Failed Invitations**

   - Alert when invitation send rate drops
   - Monitor email bounce rates

2. **Pending Approvals**

   - Alert when organizations pending > 5
   - Daily summary of pending approvals

3. **Expiring Memberships**
   - Weekly report of upcoming expirations
   - Alert for bulk expirations

---

## 🔄 Rollback Plan

If issues occur after deployment:

### 1. Rollback Application

```bash
# Revert to previous deployment
vercel rollback
```

### 2. Rollback Database (if needed)

```bash
# Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD.sql

# Or revert specific migration
supabase migration repair --status reverted <migration-id>
```

### 3. Disable Features

```sql
-- Temporarily disable organization creation
UPDATE feature_flags
SET enabled = false
WHERE feature = 'organizations';
```

---

## 📞 Support

If you encounter issues:

1. Check logs: `vercel logs --follow`
2. Review error messages in Supabase dashboard
3. Check email delivery in Brevo dashboard
4. Verify environment variables are set correctly
5. Test API endpoints with Postman/Insomnia

---

## ✅ Deployment Complete!

Once all steps are verified:

- [ ] Database migrations applied
- [ ] Application deployed
- [ ] Cron jobs configured
- [ ] Email service working
- [ ] All tests passing
- [ ] Monitoring set up
- [ ] Documentation updated

**Your multi-tenant organizations feature is now live!** 🎉
