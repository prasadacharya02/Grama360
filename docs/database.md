# Grama360 database design

PostgreSQL is the source of truth for application data. `001_initial_schema.sql` defines the core schema, `002_seed_service_categories.sql` adds the initial localized category tree, `003_provider_registration.sql` enables language-specific manual locality labels and an optional secondary phone, and `004_provider_discovery_search_indexes.sql` adds trigram indexes for text-based service-area search. The runner records applied files in `schema_migrations` and applies each migration transactionally.

## ER diagram

```text
users 1 ─── * user_roles
users 1 ─── 0..1 provider_profiles
locations 1 ─── * provider_profiles

service_categories 1 ─── * service_categories (parent_id)
provider_profiles * ─── * service_categories via provider_services
provider_profiles 1 ─── 1 availability
provider_profiles 1 ─── * working_hours
provider_profiles 1 ─── * provider_languages
provider_profiles 1 ─── * verification_records

users (customer) 1 ─── * reviews * ─── 1 provider_profiles
users 1 ─── * favorites * ─── 1 provider_profiles
users 1 ─── * reports * ─── 1 provider_profiles

users 1 ─── 0..1 admin_users
admin_users 1 ─── * admin_audit_logs
admin_users 1 ─── * verification_records (reviewed by)
admin_users 1 ─── * reports (assigned to)
provider_profiles 1 ─── * provider_metrics_daily
```

## Table responsibilities

| Table | Purpose / important rules |
|---|---|
| `users` | Firebase UID, unique E.164 phone, language, account status, server-confirmed phone verification time. Do not store OTPs. |
| `user_roles` | `CUSTOMER` and/or `PROVIDER`; a user can hold both. No app-controlled `ADMIN` role. |
| `admin_users` | Enabled staff account, permission role, MFA enrollment. Provisioned out of band; set `mfa_enrolled_at` only after Firebase MFA is actually enrolled for that staff account. |
| `service_categories` | Parent/child categories with stable slug and English/Kannada display names. Admin may deactivate rather than hard-delete referenced categories. |
| `locations` | Village/locality, taluk, district and optional approximate PostGIS point. Provider-entered labels may be English-only or Kannada-only; the point must not be a provider's exact home. |
| `provider_profiles` | Public provider information, service radius, image path, optional secondary E.164 phone, review/visibility status. One profile per user. New submissions are pending review. |
| `provider_services` | Provider/category many-to-many relation; at most one primary service per provider. |
| `availability` | Current `AVAILABLE`, `BUSY`, or `OFFLINE` state and update time. |
| `working_hours` | At most one weekly row per weekday; closed days have no open/close times. |
| `provider_languages` | Spoken language codes, including Kannada, English, and Tulu. |
| `verification_records` | Grama360 review history; an approval requires an admin and review timestamp. Phone verification is separate. |
| `reviews` | 1–5 rating, optional text, moderation status; unique `(provider_id, customer_user_id)` prevents duplicate reviewer rows. |
| `favorites` | Composite primary key prevents duplicate saves. |
| `reports` | Reason, optional description, state, assigned admin and resolution. Rate limits are enforced by the API. |
| `admin_audit_logs` | Who performed an admin action, target, timestamp and non-sensitive metadata. Never store credentials or unnecessary phone data here. |
| `provider_metrics_daily` | Aggregated profile views and Call-button taps; not call logs or proof a call completed. |

## Query and integrity notes

- `pg_trgm` indexes support service-name search in both Kannada and English; `PostGIS` GIST index supports optional distance queries.
- Provider result queries should join `provider_profiles`, `provider_services`, `service_categories`, `locations`, and `availability`, require `profile_status = 'ACTIVE'`, and paginate using a stable order.
- The API derives customer/provider/admin identity from a verified token plus database records. It must not accept `user_id`, role, reviewer ID, or admin ID from the mobile body as authority.
- Phone numbers are stored in E.164 format. Do not include them in general discovery payloads; return them only from the authenticated call-intent flow.
- Reviews are authenticated and unique per customer/provider in MVP. Since there is no booking, this prevents duplicate rows but cannot prove the reviewer received a service.
- Provider data is suspended/soft-hidden rather than hard-deleted in ordinary moderation. Deletion/anonymization policy will be finalized with privacy and legal requirements.

## Local migration commands

```bash
docker compose up -d postgres
cd backend
cp .env.example .env
npm install
npm run db:migrate
```

The local PostGIS container creates a disposable development database. Production migrations must run as a controlled deployment step, with backups and least-privilege database roles.
