# CafePanel — Vercel Deployment Guide

## Prerequisites

- [Vercel](https://vercel.com) account
- [Supabase](https://supabase.com) project with schema applied
- [Resend](https://resend.com) account for transactional email
- Domain name (optional but recommended)

---

## 1. Environment Variables

Set these in **Vercel → Project Settings → Environment Variables**:

### Required

| Variable | Example | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xyz.supabase.co` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Supabase service role key (server-only) |
| `NEXT_PUBLIC_PLATFORM_URL` | `https://cafepanel.com` | Full URL of the platform |
| `NEXT_PUBLIC_DEFAULT_TENANT_SLUG` | `yesilcam-cekmekoy` | Default tenant for the root domain |

### Email (Resend)

| Variable | Example | Description |
|---|---|---|
| `RESEND_API_KEY` | `re_...` | Resend API key |
| `FROM_EMAIL` | `noreply@cafepanel.com` | Sender email address |
| `ADMIN_NOTIFICATION_EMAIL` | `admin@example.com` | Fallback admin notification email |

### SMS (Optional)

| Variable | Example | Description |
|---|---|---|
| `SMS_PROVIDER` | `mock` | `mock`, `netgsm`, or `twilio` |
| `NETGSM_USERCODE` | | NetGSM credentials (if provider=netgsm) |
| `NETGSM_PASSWORD` | | |
| `NETGSM_HEADER` | | |
| `TWILIO_ACCOUNT_SID` | | Twilio credentials (if provider=twilio) |
| `TWILIO_AUTH_TOKEN` | | |
| `TWILIO_PHONE_NUMBER` | | |

### Multi-Tenant Domain

| Variable | Example | Description |
|---|---|---|
| `NEXT_PUBLIC_PLATFORM_DOMAIN` | `cafepanel.com` | Platform base domain for subdomain routing |

---

## 2. Deployment

```bash
# Option A: Connect repo to Vercel (recommended)
# Push to main → auto-deploys

# Option B: CLI
npx vercel --prod
```

Framework detection is automatic (Next.js). No custom build command needed.

---

## 3. Multi-Tenant Domain Strategy

### Subdomain Routing (Recommended)

Each tenant is accessible at `{slug}.cafepanel.com`.

1. Add a **wildcard domain** in Vercel: `*.cafepanel.com`
2. Set `NEXT_PUBLIC_PLATFORM_DOMAIN=cafepanel.com`
3. DNS: Add a wildcard CNAME record `*.cafepanel.com → cname.vercel-dns.com`

The middleware extracts the subdomain and resolves the tenant automatically.

### Custom Domains

Tenants can also use their own domains (e.g., `www.yesilcamkafe.com`):

1. Add the domain in Vercel project settings
2. Add DNS records as instructed by Vercel
3. Insert a row in `tenant_domains` table:
   ```sql
   INSERT INTO tenant_domains (tenant_id, domain, is_primary, is_verified)
   VALUES ('tenant-uuid', 'www.yesilcamkafe.com', true, true);
   ```

The resolver will look up the domain in the database when subdomain resolution fails.

### Single-Tenant Mode

For a single restaurant deployment, just set `NEXT_PUBLIC_DEFAULT_TENANT_SLUG` and use any domain.

---

## 4. Post-Deploy Checklist

- [ ] Verify all env vars are set in Vercel
- [ ] Check Supabase RLS policies are enabled
- [ ] Test reservation flow end-to-end
- [ ] Verify email delivery (check Resend dashboard)
- [ ] Confirm admin login works at `/admin/login`
- [ ] Test on mobile viewport
- [ ] Set up Vercel Speed Insights (optional)
- [ ] Configure Vercel Web Analytics (optional)

---

## 5. Security Headers

Security headers are configured in `vercel.json`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- API routes: `Cache-Control: no-store`

---

## 6. Supabase Configuration

Ensure the following in your Supabase project:

1. **Auth → URL Configuration**: Set Site URL to your platform URL (e.g. `https://cafepanel.com`)
2. **Auth → URL Configuration**: Add redirect URLs:
   - `https://yourdomain.com/admin/reset-password` (for password recovery)
   - `https://yourdomain.com/**` (wildcard, covers all admin auth flows)
3. **Storage**: Create a `tenant-assets` bucket with **public** access (for image uploads)
4. **RLS**: Verify all table RLS policies are active (migrations enable them automatically)
5. **Edge Functions**: Not required — all logic runs in Next.js API routes
6. **Database**: Run migrations in order via `node scripts/migrate.mjs` (requires `DATABASE_URL` in `.env.local`)
