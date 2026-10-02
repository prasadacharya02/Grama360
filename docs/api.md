# Grama360 REST API plan

Base path: `/api/v1`. All business APIs use HTTPS. Protected requests use `Authorization: Bearer <Firebase ID token>`; Express verifies the token with Firebase Admin and resolves app roles from PostgreSQL. OTP verification is performed by the Firebase mobile SDK, not by a custom OTP endpoint. Phase 2 implements `POST /auth/session`, `GET /me`, and `PUT /me/roles`. Phase 3 implements localized category listing, provider self-registration, and a minimal MFA-protected provider-profile review API. Phase 4 implements customer provider search, safe public profiles, and an authenticated call-intent endpoint. Phase 5 adds provider-owned availability updates and an availability-only discovery filter. Phase 6 currently includes customer favorites plus public-safe review listing and customer review create/edit; reports and broader review moderation remain planned.

## Authentication and account

| Method / path | Access | Purpose |
|---|---|---|
| `POST /auth/session` | Firebase-authenticated | Verify ID token, sync the Firebase UID/verified phone to `users`, return account and onboarding state. |
| `GET /me` | Authenticated | Return the caller's own safe account fields and roles. |
| `PATCH /me` | Authenticated | Update allowed fields such as display name and preferred language. |
| `PUT /me/roles` | Authenticated | Add customer/provider intent after server-side validation; never grants admin. |

## Categories, locations and discovery

| Method / path | Access | Purpose |
|---|---|---|
| `GET /categories?language=kn` | Read | Implemented. Returns active categories with English or Kannada names and parent IDs. `language` defaults to `en`; other values receive `400 INVALID_LANGUAGE`. |
| `GET /locations/search?q=...&district=...` | Read | Planned paginated manual village/town/area lookup. |
| `GET /providers?categoryId=&q=&location=&availableNow=&language=&limit=&offset=` | Authenticated customer | Implemented. Filters approved providers by active service category, provider/service text, locality/taluk/district text, and (when `availableNow=true`) availability `AVAILABLE`. Returns up to 50 results per page, localized names, availability, aggregate ratings, and no contact number. |
| `GET /providers/:providerId?language=` | Authenticated customer | Implemented. Returns an approved provider's safe public profile, service area, availability, schedule and aggregate ratings; never returns a phone number. |
| `POST /providers/:providerId/call-intent` | Authenticated customer | Implemented. Records an aggregate daily call tap and returns the verified phone number for the native dialer; this is not evidence of a completed call. |
| `GET /providers/:providerId/reviews?cursor=&limit=` | Authenticated customer | Implemented. Returns cursor-paginated visible reviews for an active provider, safe first-name display labels (never phone numbers), `isMine` markers, and the customer's own review state. |

## Provider self-service

| Method / path | Access | Purpose |
|---|---|---|
| `POST /provider-profiles` | Provider | Implemented. Transactionally create the caller's profile and request review; the server sets `PENDING_REVIEW`. |
| `GET /provider-profiles/me` | Provider | Implemented. Read only the caller's profile and review status. |
| `PATCH /provider-profiles/me` | Provider | Implemented for own `DRAFT` or `REJECTED` profiles; resubmission returns to `PENDING_REVIEW`. Pending, active, and suspended profiles are locked. |
| `PATCH /provider-profiles/me/availability` | Provider | Implemented. Body is `{ "availability": "AVAILABLE" | "BUSY" | "OFFLINE" }`. The server checks the active account, provider role, token-owned profile, and `ACTIVE` profile status; other profile states receive `409 AVAILABILITY_NOT_EDITABLE`. |
| `PUT /provider-profiles/me/services` | Provider | Replace own selected service categories transactionally. |
| `PUT /provider-profiles/me/working-hours` | Provider | Replace weekly working hours after validation. |

Provider registration requires one to five unique active service IDs, one to three spoken languages (`kn`, `en`, `tcy`), a complete seven-day schedule (weekday 0 is Sunday and 6 is Saturday) with at least one open day, a 1–200 km service radius, 0–80 years of experience, and locality/district labels entered in English or Kannada. The verified Firebase phone is the primary contact; an optional secondary phone must be a different E.164 number. The API derives the owner from the token, checks the provider role in PostgreSQL again inside the transaction, and never accepts a user ID or review status from the body. Manually entered locality/taluk/district names are stored in the language supplied; no exact household coordinates are collected.

Profile-photo upload is handled with Firebase Storage under owner-only write rules, MIME/size limits and compressed images. The registration API accepts only `provider-profiles/{firebaseUid}/profile.jpg`; no Firebase Admin secret is included in the app. The optional photo is limited to 5 MB and JPEG/PNG/WebP by Storage rules.

## Customer actions

| Method / path | Access | Purpose |
|---|---|---|
| `GET /me/favorites?language=&limit=&cursor=` | Authenticated customer | Implemented. Returns cursor-paginated saved, currently active provider summaries without contact numbers. The opaque `nextCursor` is returned when more results remain; `offset` is not accepted. |
| `PUT /me/favorites/:providerId` | Authenticated customer | Implemented and idempotent. Saves an active, publicly discoverable provider for the caller; returns `404 PROVIDER_NOT_FOUND` if the provider is not eligible. |
| `DELETE /me/favorites/:providerId` | Authenticated customer | Implemented and idempotent. Removes only the caller's saved provider and returns `{ "favorite": false }`. |
| `POST /providers/:providerId/reviews` | Authenticated active customer | Implemented. Creates one rating from 1–5 with optional trimmed text up to 1,500 characters; new reviews are immediately visible. Duplicate customer/provider reviews return `409 REVIEW_ALREADY_EXISTS`. |
| `PATCH /reviews/:reviewId` | Authenticated review owner | Implemented. Updates only the caller's own visible review; the account, provider, profile, and active service category are rechecked in PostgreSQL. |
| `POST /providers/:providerId/reports` | Customer | Planned. Report a provider with an allowlisted reason and optional details. |

Review pages contain only `VISIBLE` public reviews and use an opaque, stable `nextCursor`; the separate `myReview` field lets the customer identify and edit their own visible review without exposing contact details. `isMine` identifies the caller's public review in the list. Review writes have an additional IP-based limit of 20 requests per 15 minutes in addition to the shared API limit; per-user review/report limits and broader moderation tooling remain future hardening work.

## Admin operations

Admin requests require a verified Firebase identity, an enabled `admin_users` row with `mfa_enrolled_at` set, an ID token containing a Firebase second-factor claim, and a recent MFA sign-in (`auth_time` within 15 minutes). `SUPER_ADMIN` and `MODERATOR` can decide reviews; `SUPPORT` is read-only. Mutations write `admin_audit_logs`.

- `GET /admin/me` — implemented; returns the enabled administrator role after MFA checks.
- `GET /admin/provider-reviews?limit=&offset=` — implemented; returns pending provider submissions and safe review fields for admins.
- `POST /admin/provider-reviews/:providerId/decision` — implemented; body uses `decision: APPROVE|REJECT`; rejection requires a note. Decisions transactionally update provider and verification status and write an audit row. Rejection notes are returned only in the provider's owner-only profile response.
- `GET /admin/dashboard` — counts and basic aggregates (planned).
- `GET /admin/users` and `PATCH /admin/users/:userId/status` — inspect and suspend/restore accounts (planned).
- `GET /admin/providers?status=` and `PATCH /admin/providers/:providerId/status` — broader provider management (planned).
- `GET/POST/PATCH/DELETE /admin/categories` — manage category hierarchy; deletion is blocked when referenced, so deactivation is preferred (planned).
- `GET /admin/reports?status=` and `PATCH /admin/reports/:reportId` — assign and resolve reports (planned).
- `GET /admin/reviews?status=` and `PATCH /admin/reviews/:reviewId/moderation` — hide/restore inappropriate reviews (planned).
- `GET /admin/audit-logs` — inspect sensitive changes, restricted to authorized staff (planned).
- The native Flutter review screen uses email/password as the staff primary factor and Firebase phone MFA as the second factor. Firebase Auth email/password and Identity Platform SMS MFA must be enabled; accounts and MFA factors are provisioned out of band, and the corresponding `admin_users.mfa_enrolled_at` row must be set before access is granted. There is no self-service admin enrollment or account creation.

## Common response and safety rules

- JSON errors use `{ "error": { "code": "...", "message": "..." } }`; no stack traces or sensitive database details are returned in production.
- Inputs are validated with Zod, list endpoints enforce maximum page sizes, and SQL uses parameterized values.
- All `/api/v1` routes have a shared rate limit; session synchronization, call-intent, and review writes have additional IP-based limits. Per-user limits for reviews/reports and limits for admin mutations remain a pre-deployment hardening task.
- Search and public-profile responses never expose contact phone numbers. The customer-authenticated call-intent endpoint rechecks that the provider and account are active, increments an aggregate daily tap counter, and then returns only the verified primary number for a native dialer launch. It does not record whether a call was completed. The owner-only `GET /provider-profiles/me` response includes the provider's optional secondary number for editing and latest review note; the verified primary number remains sourced from the signed-in session.
- `GET /healthz` is liveness; `GET /readyz` requires PostgreSQL readiness. Neither reveals environment details.
