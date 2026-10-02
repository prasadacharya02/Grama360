# Grama360 — Android-first local services app

Grama360 is a native Flutter app for rural communities in Karnataka to discover nearby service providers and call them directly. **The primary product is Android mobile—not a website.** Customers and providers use the Flutter app; authorized staff have a native MFA-protected provider-review screen. Admin accounts and MFA enrollment are provisioned out of band. Future IVR/WhatsApp channels will use the same REST API.

## Repository layout

```text
mobile/       Flutter Android app (primary product)
backend/      Node.js + Express TypeScript REST API
backend/src/db/migrations/  PostgreSQL/PostGIS schema and category seeds
firebase/     Storage security rules (owner-write, authenticated-read)
docs/         Architecture, database, and API decisions
legacy-web/   Archived React/Vite prototype; reference only, not active product
```

## Implemented phases

- **Phase 1 — Foundation:** Flutter localization shell and saved language preference; Express API scaffold; PostgreSQL/PostGIS schema, category seeds, migration runner, Docker Compose database; architecture/API documentation.
- **Phase 2 — Authentication and roles:** Firebase Phone Auth screens, server ID-token verification, phone-account session sync, `/me`, and customer/provider role selection. Admin is not a selectable user role.
- **Phase 3 — Provider self-registration and review:** localized service selection and profile form, optional owner-scoped Firebase Storage photo, locality/contact/experience/radius/languages/working hours, transactional PostgreSQL persistence, pending-review status, rejection notes visible to providers, and a native MFA-protected review screen backed by the admin API.
- **Phase 4 — Customer discovery:** English/Kannada search by service and manually entered locality, approved-provider cards and safe public profiles, availability/rating summaries, and a customer-authenticated call-intent flow that opens the native phone dialer without exposing numbers in search results.
- **Phase 5 — Provider availability:** providers with active accounts and approved profiles can set `AVAILABLE`, `BUSY`, or `OFFLINE`; customers can filter for providers available now.
- **Phase 6 — Customer actions:** customers can save/remove providers, browse public-safe reviews, and submit or edit one 1–5 review per active provider. Reports and broader review moderation remain later increments.
- Firebase project values, an enabled Storage bucket with the included rules deployed, and a deployed HTTPS API URL must be configured before OTP and provider-photo flows can run. No demo or hardcoded OTP is included.

## Requirements

- Flutter stable SDK and Android Studio/Android SDK with a compatible JDK: `flutter doctor`
- Node.js 22 LTS and npm
- Docker Compose for local PostgreSQL/PostGIS (or a compatible PostgreSQL service)
- Firebase project with Phone Authentication, Storage, and Identity Platform SMS MFA enabled; enable Email/Password for out-of-band staff accounts, deploy `firebase/storage.rules`, add Android SHA-1/SHA-256 fingerprints, and configure SMS regions/quotas

The coding sandbox used for implementation has Node.js but no Flutter, Dart, Docker, or PostgreSQL, so local checks cover the backend unit suite only. GitHub Actions runs Flutter localization generation/analyze/tests and applies migrations against PostGIS; Android-device testing and live Firebase MFA/Storage flows still require project and device configuration.

## Start the API and local database

```bash
# From the repository root; requires Docker Compose
docker compose up -d postgres

cd backend
cp .env.example .env
# Set FIREBASE_PROJECT_ID. Configure Google Application Default Credentials
# or set GOOGLE_APPLICATION_CREDENTIALS to a service-account file outside Git.
npm ci
npm run db:migrate
# Optional: run provider-registration/admin-review flow against this database
RUN_DB_SMOKE=true npm run test:db
npm run dev
```

API liveness: `http://localhost:3000/api/v1/healthz`

Database readiness: `http://localhost:3000/api/v1/readyz`

The example database password is for local development only. Use managed secrets and TLS in deployed environments. Never commit `backend/.env` or Firebase Admin service-account credentials.

## Prepare and run the Flutter app

```bash
cd mobile
flutter create --platforms=android --org com.grama360 --project-name grama360 .
flutter pub get
flutter gen-l10n
flutter analyze
flutter test
cp firebase.local.example.json firebase.local.json
# Fill Firebase client identifiers, Storage bucket, and an HTTPS API URL in firebase.local.json.
flutter run --dart-define-from-file=firebase.local.json
```

`firebase.local.json` is ignored by Git. Firebase client identifiers are public app configuration; Firebase Admin credentials are server-only. See [mobile setup](mobile/README.md) for Firebase Console steps.

## Decisions and plans

- [Architecture and development phases](docs/architecture.md)
- [Database ERD and schema notes](docs/database.md)
- [REST API plan](docs/api.md)
- [Future IVR/WhatsApp integration](docs/IVR-API.md)

The root project no longer starts the archived Vite prototype. No new product features should be added under `legacy-web/`. GitHub Actions runs backend checks, Flutter analysis/tests, and a PostGIS-backed registration-to-review smoke test on pushes and pull requests (`.github/workflows/ci.yml`).
