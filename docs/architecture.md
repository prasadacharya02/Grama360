# Grama360 architecture

## Product boundary

The primary client is a native Flutter/Dart Android application. Customer, provider, and admin functionality share the app but are protected by separate server-authorized roles. The React/Vite app under `legacy-web/` is archived reference material only.

## Runtime architecture

```text
Flutter Android app
  ├── Firebase Phone Auth (OTP; Firebase ID token)
  ├── Firebase Storage (profile photo upload, owner-write rules)
  └── HTTPS /api/v1
           │ Bearer Firebase ID token
           ▼
Node.js 22 + Express 5 + TypeScript
  ├── Firebase Admin verifies ID tokens
  ├── Zod request validation and role/ownership authorization
  ├── parameterized PostgreSQL queries
  └── provider photo metadata / call-intent logging
           ▼
PostgreSQL + PostGIS

Future IVR / WhatsApp channel ── HTTPS /api/v1 ──┘
```

The app never connects directly to PostgreSQL. Firebase is used for phone authentication and image storage; application roles, provider state, reviews, and moderation remain in PostgreSQL. Firebase credentials are server-only. The mobile Firebase config is an app identifier/configuration, not an authorization mechanism.

## Technology decisions

- **Flutter stable / Dart:** Android-first, shared Flutter code for future iOS if needed.
- **Riverpod + GoRouter:** app state and navigation, organized by feature.
- **Flutter ARB localization:** `mobile/lib/l10n/app_en.arb` and `app_kn.arb`; language preference stored on device.
- **Firebase Phone Auth:** OTP delivery and token lifecycle handled by the SDK; Express verifies each protected request using Firebase Admin.
- **Express + TypeScript:** API boundary; `pg` parameterized SQL, Zod validation, Helmet, rate limits, Pino logs.
- **PostgreSQL + PostGIS:** relational integrity and optional radius search. Village/locality remains the normal location choice; GPS is optional.
- **Firebase Storage:** provider photos use owner-only writes, authenticated reads, image MIME/size restrictions, and compressed uploads.
- **FCM:** future notifications; not required for the foundation.

## Flutter structure

```text
mobile/lib/
├── main.dart
├── app/                    # app, router, theme, locale controller
├── core/                   # shared networking, errors, permissions, widgets
└── features/
    ├── auth/               # Phase 2
    ├── onboarding/         # language selection foundation
    ├── customer_home/
    ├── categories/
    ├── discovery/
    ├── provider_profile/
    ├── provider_registration/
    ├── provider_dashboard/
    ├── availability/
    ├── reviews/
    ├── favorites/
    ├── reports/
    ├── account/
    └── admin/
```

Each implemented feature will separate presentation, application/state, domain models, and data/API code as it grows. Avoid a large all-in-one screen or coupling widgets directly to PostgreSQL.

## Backend structure

```text
backend/src/
├── app.ts, server.ts
├── config/                 # parsed environment and logger
├── middleware/             # auth, roles, validation, error handling (added by phase)
├── db/                     # pool, SQL migration runner, migrations and seeds
├── modules/                # auth, users, categories, providers, reviews, etc.
└── shared/                 # common errors and API types
```

`/api/v1/healthz` is a liveness check. `/api/v1/readyz` checks the configured database. Phase 2 implements Firebase ID-token verification, `POST /api/v1/auth/session`, `GET /api/v1/me`, and `PUT /api/v1/me/roles`. Phase 3 implements localized categories, provider self-registration (`GET/POST/PATCH /provider-profiles`), and a minimal MFA-protected admin review queue/decision API; customer discovery and broader admin management remain later phases.

## Important behavior and privacy decisions

- A user may have customer and provider roles. Only a backend-admin-provisioned `admin_users` record grants admin access; the app cannot promote itself.
- A new provider submission is stored as `PENDING_REVIEW` in a PostgreSQL transaction and gets a pending Grama360 verification record. Only `ACTIVE` profiles are searchable. Providers may edit `DRAFT` or `REJECTED` profiles and resubmit; pending, active, and suspended profiles are locked. Phone OTP does not grant the manual Grama360 badge.
- OFFLINE providers retain profiles but are excluded from “available now” results by default. BUSY can be shown distinctly.
- Search responses omit provider phone numbers. A protected call-intent endpoint returns the number only after the customer taps Call and logs a **tap**, not a completed call. Android opens the system dialer; masking requires a future call-relay service.
- Location coordinates represent an approximate village/town centroid, not a provider's home. GPS is never mandatory.
- Reviews are one per authenticated customer/provider pair for MVP, editable through policy, rate-limited and reportable. Without booking, the app cannot prove a service took place.
- Images are resized before upload. Lists are paginated; category/location data can be cached by the mobile app.
- The implemented review API requires an enabled `admin_users` row with `mfa_enrolled_at`, a verified Firebase second-factor claim, and an `auth_time` within 15 minutes. Review decisions are restricted to `SUPER_ADMIN`/`MODERATOR`, written to `admin_audit_logs`, and rejection notes are visible only to the provider who owns that profile. The native review UI supports staff email/password plus Firebase phone-MFA sign-in; accounts and MFA enrollment are provisioned out of band.

## Development phases

1. **Foundation:** Flutter structure, localization, API skeleton, PostgreSQL schema/migrations.
2. **Authentication/roles:** Firebase OTP, token verification, account sync, role selection, protected routes.
3. **Provider registration (implemented):** localized provider form, category selection, optional owner-scoped photo, locality/contact/experience/radius/languages/working hours, transactional persistence, pending-review status, and a minimal MFA-protected review API.
4. **Customer home/categories:** localized category browsing and simple home.
5. **Discovery:** Kannada/English search, village and availability filters, pagination.
6. **Profiles/calling:** details, protected call intent, native dialer.
7. **Availability/location:** status updates, optional GPS and PostGIS radius query.
8. **Reviews/favorites/reports:** authenticated customer workflows and moderation states.
9. **Admin:** the native provider-review UI and approve/reject API are implemented. Broader provider/category/report/review/user management, metrics, and audit browsing are planned.
10. **Hardening:** tests, authorization/security review, accessibility, low-bandwidth and query tuning.
11. **Android release:** signed APK/AAB guidance and installation validation.

## Local developer setup

See the root README for setup commands. Local Docker credentials are development-only. In production, use a managed PostgreSQL/PostGIS service, TLS, workload identity or a secret manager, restricted Firebase rules, and monitored backups.
